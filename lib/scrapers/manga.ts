import puppeteer from 'puppeteer';

export interface MangaInfo {
  id: string;
  title: string;
  type: string;
  cover: string;
  author: string;
  description: string;
  genres: string[];
  chapters: {
    id: string;
    title: string;
    pages: { id: string; imageUrl: string; }[];
  }[];
}

export async function scrapeManga(url: string = 'https://westmanga.me'): Promise<MangaInfo[]> {
  const browser = await puppeteer.launch({
    headless: 'new' as any,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0' });

    const mangaList = await page.evaluate(() => {
      const items = document.querySelectorAll('.listupd .bs');
      return Array.from(items).map(item => {
        const link = item.querySelector('a')?.getAttribute('href') || '';
        const cover = item.querySelector('img')?.getAttribute('src') || '';
        const title = item.querySelector('.tt')?.textContent?.trim() || '';
        const type = item.querySelector('.type')?.textContent?.trim() || '';

        return {
          id: link.split('/').pop() || '',
          title,
          type,
          cover,
          author: '',
          description: '',
          genres: [] as string[],
          chapters: [] as MangaInfo['chapters']
        };
      });
    });

    // Get additional details for each manga
    for (const manga of mangaList) {
      if (!manga.id) continue;

      await page.goto(`https://westmanga.me/manga/${manga.id}`, { waitUntil: 'networkidle0' });
      
      const details = await page.evaluate(() => {
        const description = document.querySelector('.entry-content')?.textContent?.trim() || '';
        const author = document.querySelector('.infox .fmed')?.textContent?.trim() || '';
        const genres = Array.from(document.querySelectorAll('.genre-info a'))
          .map(genre => genre.textContent?.trim() || '');
        
        const chapters = Array.from(document.querySelectorAll('#chapterlist li')).map(ch => ({
          id: ch.querySelector('a')?.getAttribute('href')?.split('/').pop() || '',
          title: ch.querySelector('a')?.textContent?.trim() || '',
          pages: [] as MangaInfo['chapters'][0]['pages']
        }));

        return { description, author, genres, chapters };
      });

      manga.description = details.description;
      manga.author = details.author;
      manga.genres = details.genres;
      manga.chapters = details.chapters;

      // Get pages for first chapter as example
      if (manga.chapters.length > 0) {
        const firstChapter = manga.chapters[0];
        await page.goto(`https://westmanga.me/${manga.id}/${firstChapter.id}`, { waitUntil: 'networkidle0' });
        
        const pages = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('.reader-area img')).map((img, index) => ({
            id: `page-${index + 1}`,
            imageUrl: img.getAttribute('src') || ''
          }));
        });

        firstChapter.pages = pages;
      }
    }

    return mangaList;
  } finally {
    await browser.close();
  }
}