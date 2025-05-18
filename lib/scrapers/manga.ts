import puppeteer, { Page } from 'puppeteer';

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
    url?: string;
    pages: { id: string; imageUrl: string; }[];
  }[];
  url?: string;
}

export async function scrapeManga(targetUrl: string = 'https://westmanga.me'): Promise<MangaInfo[]> {
  const browser = await puppeteer.launch({
    headless: 'new' as any,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  console.log(`[MangaScraper] Browser launched. Scraping: ${targetUrl}`);

  let page: Page | undefined;

  try {
    page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.setViewport({ width: 1280, height: 800 });
    console.log(`[MangaScraper] Navigating to ${targetUrl}`);
    await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 60000 });
    console.log(`[MangaScraper] Page loaded: ${targetUrl}`);

    const mangaListFromPage = await page.evaluate(() => {
      // Selector yang lebih umum dan beberapa alternatif yang sering ditemukan
      const selectors = [
        'div.utao article', // Umumnya ada di dalam div dengan class 'utao' atau 'listupd'
        'div.listupd article',
        'article.bs', // Class 'bs' (box-shadow atau block-story) sering dipakai
        'div.bs', // Kadang item adalah div dengan class 'bs'
        'div.uta', // Alternatif untuk 'utao'
        '.bixbox ul li', // Struktur list umum lainnya
        '.list-update_item', // Class yang lebih deskriptif
        'div.animepost', // Terkadang digunakan juga untuk manga
        'article[class*="post-"]' // Mencari article dengan class yang mengandung "post-"
      ];
      let items: Element[] = [];
      for (const selector of selectors) {
        items = Array.from(document.querySelectorAll(selector));
        if (items.length > 0) {
          console.log(`[MangaScraper-EvaluateList] Found ${items.length} manga items using selector: ${selector}`);
          break; // Gunakan selector pertama yang berhasil menemukan item
        }
      }

      // Jika tidak ada item yang ditemukan setelah mencoba semua selector
      if (items.length === 0) {
        console.warn('[MangaScraper-EvaluateList] No manga items found with any of the tried selectors.');
        return [];
      }
      
      // const items = Array.from(document.querySelectorAll('.listupd .bs, .listupd .bsx, article.bs, .utao .bsx'));
      // console.log(`[MangaScraper-EvaluateList] Found ${items.length} manga items on list page.`);
      return items.map(item => {
        const linkElement = item.querySelector('a');
        const url = linkElement?.getAttribute('href') || '';
        const cover = item.querySelector('img')?.getAttribute('src') || item.querySelector('img')?.getAttribute('data-src') || '';
        const title = item.querySelector('.tt, .title, h2, h4')?.textContent?.trim() || '';
        const type = item.querySelector('.type, .label_type, .typeflag')?.textContent?.trim() || '';
        
        let id = '';
        if (url) {
          try {
            const urlObject = new URL(url);
            const pathParts = urlObject.pathname.split('/').filter(part => part.length > 0);
            if (pathParts.length > 0 && (pathParts[0] === 'manga' || pathParts[0] === 'series')) {
                 id = pathParts[pathParts.length -1];
            } else if (pathParts.length > 0) {
                 id = pathParts[pathParts.length -1];
            }
          } catch (e) {
            console.error(`[MangaScraper-EvaluateList] Error parsing URL for ID: ${url}`, e);
          }
        }
        if (!id && title) {
            id = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        }

        return {
          id,
          title,
          type,
          cover,
          author: '',
          description: '',
          genres: [] as string[],
          chapters: [] as MangaInfo['chapters'],
          url: url,
        };
      }).filter(manga => manga.id && manga.title && manga.url);
    });
    console.log(`[MangaScraper] Initial manga list extracted. Count: ${mangaListFromPage.length}`);

    if (mangaListFromPage.length === 0) {
        console.warn(`[MangaScraper] No manga items found on ${targetUrl}. Check selectors for the list page.`);
    }

    const detailedMangaList: MangaInfo[] = [];
    // const limitDetailFetch = Math.min(mangaListFromPage.length, 3); // Hapus atau komentari baris ini
    // console.log(`[MangaScraper] Attempting to fetch details for up to ${limitDetailFetch} manga.`);

    for (let i = 0; i < mangaListFromPage.length; i++) {
      const manga = mangaListFromPage[i];
      if (!manga.url) {
        console.warn(`[MangaScraper] Manga "${manga.title}" has no URL, skipping detail fetch.`);
        continue;
      }
      console.log(`[MangaScraper] Fetching details for: ${manga.title} (ID: ${manga.id}) from ${manga.url}`);
      try {
        if (!page) throw new Error("Page object is not initialized");
        await page.goto(manga.url, { waitUntil: 'networkidle0', timeout: 60000 });
        
        const details = await page.evaluate(() => {
            const getText = (selector: string, context?: Document | Element): string => {
                const el = (context || document).querySelector(selector);
                return el?.textContent?.trim() || '';
            };
        
            const getAllText = (selector: string, context?: Document | Element): string[] => {
                return Array.from((context || document).querySelectorAll(selector))
                    .map(el => el.textContent?.trim() || '')
                    .filter(Boolean);
            };
        
            const getAttribute = (selector: string, attribute: string, context?: Document | Element): string => {
                const el = (context || document).querySelector(selector);
                return el?.getAttribute(attribute) || '';
            }
        
            const descriptionSelectors = [
                '.entry-content p', '.entry-content', '.sinops p', '.sinopsis', '#desc .entry-content-single', 
                '.infotable span[itemprop="description"]', '.wd-full p', '.spe span[itemprop="description"]',
                '.summary__content p', '.description-summary p', '.panel-story-description p'
            ];
            let description = '';
            for (const selector of descriptionSelectors) {
                description = getText(selector);
                if (description) break;
            }
        
            let author = '';
            const authorLabelSelectors = ['.imptdt', '.fmed', '.tsinfo .imptdt', '.infox .fmed', '.spe span', '.tsinfo td', '.entry-content-single table td'];
            for (const labelSelector of authorLabelSelectors) {
                const elements = Array.from(document.querySelectorAll(labelSelector));
                for (const el of elements) {
                    const text = el.textContent?.toLowerCase() || '';
                    if (text.includes('author') || text.includes('penulis') || text.includes('pengarang')) {
                        let potentialAuthorElement = el.nextElementSibling || el.querySelector('span, i, a, b') || el;
                         if (el.tagName === 'TD' && el.nextElementSibling) potentialAuthorElement = el.nextElementSibling; // For table structures
                         else if (el.parentElement?.tagName === 'SPAN' && el.parentElement?.nextElementSibling) potentialAuthorElement = el.parentElement.nextElementSibling; // Handle span > label, span > value
        
                        if (potentialAuthorElement && potentialAuthorElement.textContent) {
                            author = potentialAuthorElement.textContent.replace(/Author:|Penulis:|Pengarang:/gi, '').trim();
                            if (author) break;
                        }
                    }
                }
                if (author) break;
            }
             if (!author) { // Fallback if the above structured search fails
                const allText = document.body.innerText;
                const authorMatch = allText.match(/(?:Author|Pengarang|Penulis)\s*:\s*([^\n,]+)/i);
                if (authorMatch && authorMatch[1]) {
                    author = authorMatch[1].trim();
                }
            }
        
        
            let genres: string[] = [];
            const genreContainerSelectors = ['.mgen', '.genre-info', '.seriestogenre', '.seriestocategory', '.infotable', '.wd-full .textleft', '.spe'];
            for (const containerSelector of genreContainerSelectors) {
                const container = document.querySelector(containerSelector);
                if (container) {
                    if (containerSelector === '.infotable') { // Special handling for tables
                         const rows = Array.from(container.querySelectorAll('tr'));
                         for(const row of rows){
                             if(row.cells[0] && row.cells[0].textContent?.toLowerCase().includes('genre')){
                                 genres = getAllText('a', row.cells[1]);
                                 break;
                             }
                         }
                    } else {
                        genres = getAllText('a', container);
                    }
                    if (genres.length > 0) break;
                }
            }
            if (genres.length === 0) { // Broader fallback
                genres = getAllText('span[itemprop="genre"] a, a[href*="/genres/"], a[href*="/genre/"]');
            }
            genres = genres.filter(g => g.length > 0 && g.length < 30); // Filter out overly long or empty genre tags
        
        
            const chaptersData: MangaInfo['chapters'] = []; // Changed variable name to avoid conflict
            const chapterListSelectors = ['#chapterlist li', '.cl li', '.chlist li', 'ul.clstyle li', '.bxcl ul li', '.chapter-list li', '.lista_episodios li', '.post_val_list ul li', 'div.eph-num'];
        
            for (const listSelector of chapterListSelectors) {
                const chapterElements = Array.from(document.querySelectorAll(listSelector));
                if (chapterElements.length > 0) {
                    for (const ch of chapterElements) {
                        const linkElement = ch.querySelector('a');
                        const chapterUrl = linkElement?.getAttribute('href') || '';
                        
                        let chapterTitle = (linkElement?.textContent?.trim() || 
                                           getText('.chapternum', ch) || 
                                           getText('.lchx', ch) || 
                                           getText('span.leftoff', ch) ||
                                           getText('.ceastatus', ch) ||
                                           getText('.chapter-manhwa-title', ch) ||
                                           getText('.eph-num > *:first-child', ch) || // get text from first child of .eph-num
                                           '').replace(/\s+/g, ' ').trim();
        
                        let chapterId = '';
                        if (chapterUrl) {
                            try {
                                const urlObj = new URL(chapterUrl);
                                const pathParts = urlObj.pathname.split('/').filter(part => part && !part.match(/^\d+$/) && part !== 'read'); // Filter out numbers and 'read'
                                chapterId = pathParts.pop() || ''; // Take the last segment
                                if (!chapterId && pathParts.length > 0) chapterId = pathParts.pop() || ''; // try one more if last was empty
                            } catch (e) { /* ignore */ }
                        }
                        if (!chapterId && chapterTitle) {
                            chapterId = chapterTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                        }
        
                        if (chapterId && chapterTitle && chapterUrl) {
                            chaptersData.push({
                                id: chapterId,
                                title: chapterTitle,
                                url: chapterUrl,
                                pages: []
                            });
                        }
                    }
                    if (chaptersData.length > 0) break; // Found chapters, no need to check other list selectors
                }
            }
            return { description, author, genres, chapters: chaptersData }; // Use chaptersData
        });

        manga.description = details.description;
        manga.author = details.author;
        manga.genres = details.genres;
        manga.chapters = details.chapters;
        console.log(`[MangaScraper] Successfully fetched details for: ${manga.title} (Author: ${manga.author}, Chapters: ${manga.chapters.length})`);
        detailedMangaList.push(manga);

        if (manga.chapters.length > 0 && manga.chapters[0].url) {
          const firstChapter = manga.chapters[0];
          if (typeof firstChapter.url === 'string') { 
            console.log(`[MangaScraper] Fetching pages for chapter: ${firstChapter.title} from ${firstChapter.url}`);
            try {
                if (!page) throw new Error("Page object is not initialized");
                if (typeof firstChapter.url !== 'string') throw new Error("Chapter URL is not a string");
                await page.goto(firstChapter.url, { waitUntil: 'networkidle0', timeout: 90000 });
                
                await page.waitForSelector('.reader-area img, #readerarea img, .comic_page img, .wp-block-image img, .ts-main-image, #imagen_actual, .main-img, .reading-content img, .page-break img, .iv-card img', { timeout: 15000 }).catch(() => {
                  console.warn(`[MangaScraper] Timeout or no images found with primary selectors for chapter: ${firstChapter.title}`);
                });

                await page.evaluate(async () => {
                  const distance = 100;
                  const delay = 100;
                  while (window.scrollY + window.innerHeight < document.body.scrollHeight) {
                    window.scrollBy(0, distance);
                    await new Promise(resolve => setTimeout(resolve, delay));
                  }
                });

                await new Promise(resolve => setTimeout(resolve, 2000));

                const pages = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('.reader-area img, #readerarea img, .comic_page img, .wp-block-image img, .ts-main-image, #imagen_actual, .main-img, .reading-content img, .page-break img, .iv-card img[src]'))
                    .map((img, index) => {
                    let imageUrl = '';
                    if (img.tagName === 'IMG') {
                        imageUrl = img.getAttribute('src') || img.getAttribute('data-src') || '';
                    } else if (img.tagName === 'DIV' && (img as HTMLElement).style.backgroundImage) {
                        imageUrl = (img as HTMLElement).style.backgroundImage.slice(4, -1).replace(/["']/g, "");
                    }
                    return {
                        id: `page-${index + 1}`,
                        imageUrl: imageUrl.trim()
                    };
                    }).filter(page => page.imageUrl && (page.imageUrl.startsWith('http://') || page.imageUrl.startsWith('https://')));
                });
                firstChapter.pages = pages;
                console.log(`[MangaScraper] Fetched ${pages.length} pages for chapter: ${firstChapter.title}`);
            } catch (pageError) {
                console.error(`[MangaScraper] Error fetching pages for chapter ${firstChapter.title} (${firstChapter.url}):`, pageError);
            }
          }
        }
      } catch (detailError) {
        console.error(`[MangaScraper] Error fetching details for manga ${manga.title} (ID: ${manga.id}, URL: ${manga.url}):`, detailError);
      }
    }
    return detailedMangaList;
  } catch (error) {
    console.error('[MangaScraper] A critical error occurred:', error);
    throw error;
  } finally {
    console.log('[MangaScraper] Closing browser.');
    if (browser) await browser.close();
  }
}