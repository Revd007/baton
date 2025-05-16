import puppeteer from 'puppeteer';

export interface AnimeInfo {
  id: string;
  title: string;
  type: string;
  thumbnail: string;
  description: string;
  genres: string[];
  episodes: {
    id: string;
    title: string;
    thumbnail: string;
    videoUrl: string;
  }[];
}

export async function scrapeAnime(url: string = 'https://9animetv.to/home'): Promise<AnimeInfo[]> {
  const browser = await puppeteer.launch({
    headless: 'new' as any,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0' });

    const animeList = await page.evaluate(() => {
      const items = document.querySelectorAll('.film_list-wrap .flw-item');
      return Array.from(items).map(item => {
        const link = item.querySelector('.film-poster-ahref')?.getAttribute('href') || '';
        const thumbnail = item.querySelector('img')?.getAttribute('data-src') || '';
        const title = item.querySelector('.film-name')?.textContent?.trim() || '';
        const type = item.querySelector('.fd-infor .fdi-item')?.textContent?.trim() || '';

        return {
          id: link.split('/').pop() || '',
          title,
          type,
          thumbnail,
          description: '',
          genres: [] as string[],
          episodes: [] as AnimeInfo['episodes']
        };
      });
    });

    // Get additional details for each anime
    for (const anime of animeList) {
      if (!anime.id) continue;

      await page.goto(`https://9animetv.to/watch/${anime.id}`, { waitUntil: 'networkidle0' });
      
      const details = await page.evaluate(() => {
        const description = document.querySelector('.film-description')?.textContent?.trim() || '';
        const genres = Array.from(document.querySelectorAll('.film-info .genres a'))
          .map(genre => genre.textContent?.trim() || '');
        
        const episodes = Array.from(document.querySelectorAll('.ss-list a')).map(ep => ({
          id: ep.getAttribute('href')?.split('/').pop() || '',
          title: ep.textContent?.trim() || '',
          thumbnail: '',
          videoUrl: ep.getAttribute('href') || ''
        }));

        return { description, genres, episodes };
      });

      anime.description = details.description;
      anime.genres = details.genres;
      anime.episodes = details.episodes;
    }

    return animeList;
  } finally {
    await browser.close();
  }
}