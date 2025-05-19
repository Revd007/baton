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
    chapter_number?: number;
    url?: string;
    pages: { imageUrl: string; }[];
  }[];
  url?: string;
  source?: string;
}

export async function scrapeManga(initialTargetUrl: string = 'https://westmanga.me/manga/'): Promise<MangaInfo[]> {
  const browser = await puppeteer.launch({
    headless: 'new' as any,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  console.log(`[MangaScraper] Browser launched. Initial target: ${initialTargetUrl}`);

  let page: Page | undefined;
  const allMangaFromAllPages: Partial<MangaInfo>[] = [];
  let currentPageUrl: string | null = initialTargetUrl;
  let pageCount = 0;
  const detailedMangaList: MangaInfo[] = [];

  try {
    page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.setViewport({ width: 1366, height: 768 });

    while (currentPageUrl) {
      pageCount++;
      console.log(`[MangaScraper] Scraping page ${pageCount}: ${currentPageUrl}`);
      await page.goto(currentPageUrl, { waitUntil: 'networkidle2', timeout: 900000 });
      console.log(`[MangaScraper] Page loaded: ${currentPageUrl}`);

      const mangaListFromCurrentPage = await page.evaluate(() => {
        const selectors = [
          'div.utao article', 'div.listupd article', 'article.bs', 'div.bs', 'div.uta',
          '.bixbox ul li', '.list-update_item', 'div.animepost', 'article[class*="post-"]'
        ];
        let items: Element[] = [];
        for (const selector of selectors) {
          items = Array.from(document.querySelectorAll(selector));
          if (items.length > 0) {
            console.log(`[MangaScraper-EvaluateList] Found ${items.length} manga items on page using selector: ${selector}`);
            break;
          }
        }
        if (items.length === 0) {
          console.warn('[MangaScraper-EvaluateList] No manga items found on this page with any of the tried selectors.');
          return [];
        }
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
              const firstPathPart = pathParts[0];
              if (firstPathPart === 'manga' || firstPathPart === 'series' || firstPathPart === 'komik') {
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
            id, title, type, cover, url,
            source: 'westmanga.me',
            author: '', description: '', genres: [], chapters: []
          };
        }).filter(manga => manga.id && manga.title && manga.url);
      });
      
      allMangaFromAllPages.push(...mangaListFromCurrentPage);
      console.log(`[MangaScraper] Scraped ${mangaListFromCurrentPage.length} items from ${currentPageUrl}. Total items so far: ${allMangaFromAllPages.length}`);

      currentPageUrl = await page.evaluate(() => {
        const nextLinkSelectors = [
          'a.next.page-numbers',
          'a.nextpostslink', 
          'a[rel="next"]',
          '.pagination .next a',
          'li.page-item.active + li.page-item a.page-link'
        ];
        for (const selector of nextLinkSelectors) {
          const link = document.querySelector(selector) as HTMLAnchorElement;
          if (link && link.href) {
            return link.href;
          }
        }
        return null;
      });

      if (currentPageUrl) {
        console.log(`[MangaScraper] Next page found: ${currentPageUrl}`);
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000)); 
      } else {
        console.log('[MangaScraper] No more pages found or pagination limit reached.');
      }
    }

    console.log(`[MangaScraper] Finished scraping all list pages. Total initial manga items: ${allMangaFromAllPages.length}`);
    
    const limitDetailFetch = allMangaFromAllPages.length;
    console.log(`[MangaScraper] Attempting to fetch details for up to ${limitDetailFetch} manga items.`);

    for (let i = 0; i < limitDetailFetch; i++) {
      const manga = allMangaFromAllPages[i];
      if (!manga.url || !page) {
        console.warn(`[MangaScraper] Manga "${manga.title}" (Source URL: ${manga.url}) has no URL or page object is invalid, skipping detail fetch.`);
        continue;
      }
      console.log(`[MangaScraper] (${i + 1}/${limitDetailFetch}) Fetching details for: ${manga.title} (ID: ${manga.id}) from ${manga.url}`);
      try {
        await page.goto(manga.url, { waitUntil: 'networkidle2', timeout: 9000000 });
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
            const descriptionSelectors = [
                '.entry-content p', '.entry-content', '.sinops p', '.sinopsis', '#desc .entry-content-single', 
                '.infotable span[itemprop="description"]', '.wd-full p', '.spe span[itemprop="description"]',
                '.summary__content p', '.description-summary p', '.panel-story-description p', '.konten .entry-content'
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
                        let potentialAuthorElement = el.nextElementSibling || el.querySelector('span, i, a, b') || el.parentElement?.querySelector('span, i, a, b, td');
                         if (el.tagName === 'TD' && el.nextElementSibling) potentialAuthorElement = el.nextElementSibling;
                         else if (el.parentElement?.tagName === 'SPAN' && el.parentElement?.nextElementSibling) potentialAuthorElement = el.parentElement.nextElementSibling;
                        if (potentialAuthorElement && potentialAuthorElement.textContent && potentialAuthorElement.textContent.trim().length < 50) {
                            author = potentialAuthorElement.textContent.replace(/Author:|Penulis:|Pengarang:/gi, '').trim();
                            if (author && author.toLowerCase() !== 'author' && author.toLowerCase() !== 'pengarang' && author.toLowerCase() !== 'penulis') break;
                            else author = '';
                        }
                    }
                }
                if (author) break;
            }
             if (!author) {
                const allText = document.body.innerText;
                const authorMatch = allText.match(/(?:Author|Pengarang|Penulis)\s*:\s*([^\n,]{2,50})/i);
                if (authorMatch && authorMatch[1]) {
                    author = authorMatch[1].trim();
                }
            }
            let genres: string[] = [];
            const genreContainerSelectors = ['.mgen', '.genre-info', '.seriestogenre', '.seriestocategory', '.infotable', '.wd-full .textleft', '.spe', '.info-genre', '.infox .genre-wp > a'];
            for (const containerSelector of genreContainerSelectors) {
                const container = document.querySelector(containerSelector);
                if (container) {
                    if (containerSelector === '.infotable' || containerSelector === '.infox .genre-wp > a') {
                         const rows = Array.from(container.querySelectorAll('tr, span'));
                         for(const row of rows){
                             if(row.textContent?.toLowerCase().includes('genre')){
                                 genres = getAllText('a', row.parentElement?.querySelector('td:last-child, :scope') || row );
                                 break;
                             }
                         }
                         if (containerSelector === '.infox .genre-wp > a') {
                            genres = Array.from(document.querySelectorAll(containerSelector)).map(el => el.textContent?.trim() || '').filter(Boolean);
                         }
                    } else {
                        genres = getAllText('a', container);
                    }
                    if (genres.length > 0) break;
                }
            }
            if (genres.length === 0) { 
                genres = getAllText('span[itemprop="genre"] a, a[href*="/genres/"], a[href*="/genre/"]');
            }
            genres = Array.from(new Set(genres.filter(g => g.length > 0 && g.length < 30)));
            const chaptersData: MangaInfo['chapters'] = [];
            const chapterListSelectors = ['#chapterlist li', '.cl li', '.chlist li', 'ul.clstyle li', '.bxcl ul li', '.chapter-list li', '.lista_episodios li', '.post_val_list ul li', 'div.eph-num', '.epsleft .lchx a', '.chbox li'];
            for (const listSelector of chapterListSelectors) {
                const chapterElements = Array.from(document.querySelectorAll(listSelector));
                if (chapterElements.length > 0) {
                    console.log(`[MangaScraper-EvaluateDetails] Found ${chapterElements.length} chapter elements using selector: ${listSelector}`);
                    for (const ch of chapterElements) {
                        const linkElement = (listSelector.endsWith(' a') ? ch : ch.querySelector('a')) as HTMLAnchorElement;
                        if (!linkElement) continue;
                        const chapterUrl = linkElement?.href || '';
                        let chapterTitleText = (linkElement?.textContent?.trim() || 
                                           getText('.chapternum', ch) || 
                                           getText('.lchx', ch) || 
                                           getText('span.leftoff', ch) ||
                                           getText('.ceastatus', ch) ||
                                           getText('.chapter-manhwa-title', ch) ||
                                           getText('.eph-num > *:first-child', ch) ||
                                           '');
                        const chapterTitle = chapterTitleText.replace(/\s+/g, ' ').trim();
                        let chapterId = '';
                        if (chapterUrl) {
                            try {
                                const urlObj = new URL(chapterUrl);
                                const pathParts = urlObj.pathname.split('/').filter(part => part && !part.match(/^\d+$/) && part !== 'read' && part !== 'chapter');
                                chapterId = pathParts.pop() || '';
                                if (!chapterId && pathParts.length > 0) chapterId = pathParts.pop() || '';
                                chapterId = chapterId.replace(/^chapter-/i, '');
                            } catch (e) { /* ignore */ }
                        }
                        if (!chapterId && chapterTitle) {
                            chapterId = chapterTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                        }
                        let num = NaN;
                        const titleForNumberExtraction = chapterTitleText; 
                        const primaryMatch = titleForNumberExtraction.match(/(?:ch(?:apter)?|eps|episode|#|bab|bagian|vol(?:ume)?)\.?\s*([\d\.-]+)/i);
                        if (primaryMatch && primaryMatch[1]) {
                            num = parseFloat(primaryMatch[1].split('-')[0]);
                        } else {
                            const secondaryMatch = titleForNumberExtraction.match(/([\d\.-]+)/);
                            if (secondaryMatch && secondaryMatch[1]) {
                                num = parseFloat(secondaryMatch[1].split('-')[0]);
                            }
                        }
                        if (isNaN(num)) {
                            console.warn(`[MangaScraper-EvaluateDetails] Gagal parse nomor chapter dari teks: "${titleForNumberExtraction}". Judul: "${chapterTitle}"`);
                        } else {
                           console.log(`[MangaScraper-EvaluateDetails] Berhasil parse nomor chapter: ${num} dari teks: "${titleForNumberExtraction}"`);
                        }
                        if (chapterId && chapterTitle && chapterUrl) {
                            chaptersData.push({
                                id: chapterId,
                                title: chapterTitle,
                                chapter_number: isNaN(num) ? undefined : num,
                                url: chapterUrl,
                                pages: []
                            });
                        }
                    }
                    if (chaptersData.length > 0) break;
                }
            }
            return { description, author, genres, chapters: chaptersData };
        });

        const updatedManga: MangaInfo = {
          id: manga.id!,
          title: manga.title!,
          type: manga.type!,
          cover: manga.cover!,
          author: details.author || manga.author || '',
          description: details.description || manga.description || '',
          genres: details.genres && details.genres.length > 0 ? details.genres : manga.genres || [],
          chapters: details.chapters && details.chapters.length > 0 ? details.chapters : manga.chapters || [],
          url: manga.url!,
          source: manga.source || 'westmanga.me',
        };
        detailedMangaList.push(updatedManga);
        console.log(`[MangaScraper] Successfully fetched details for: ${updatedManga.title} (Chapters: ${updatedManga.chapters.length})`);

        // Fetch pages for each chapter
        if (updatedManga.chapters && updatedManga.chapters.length > 0 && page) {
            console.log(`[MangaScraper] Attempting to fetch pages for ${updatedManga.chapters.length} chapters of "${updatedManga.title}"`);
            for (let chIdx = 0; chIdx < updatedManga.chapters.length; chIdx++) {
                const chapterToFetch = updatedManga.chapters[chIdx];
                if (!chapterToFetch.url) {
                    console.warn(`[MangaScraper] Chapter "${chapterToFetch.title}" has no URL, skipping page fetching.`);
                    continue;
                }
                console.log(`[MangaScraper] (${chIdx + 1}/${updatedManga.chapters.length}) Fetching pages for chapter: "${chapterToFetch.title}" from ${chapterToFetch.url}`);
                try {
                    await page.goto(chapterToFetch.url, { waitUntil: 'networkidle2', timeout: 75000 });
                    
                    await page.evaluate(async () => { // Scroll logic
                        await new Promise<void>((resolve) => {
                            let totalHeight = 0; const distance = 200; const timer = setInterval(() => {
                                const scrollHeight = document.body.scrollHeight; window.scrollBy(0, distance); totalHeight += distance;
                                if (totalHeight >= scrollHeight - window.innerHeight) { clearInterval(timer); resolve(); }
                            }, 100);
                        });
                    });
                    await new Promise(resolve => setTimeout(resolve, 2000));

                    const chapterPages = await page.evaluate(() => {
                        const pageImageSelectors = [
                            '.reader-area img', '#readerarea img', '.comic_page img', '.wp-block-image img',
                            '.ts-main-image', '#imagen_actual', '.main-img', '.reading-content img',
                            '.page-break img', '.iv-card img[src]', '#Baca_Komik img' // Menambahkan selector dari komiku juga untuk generalisasi
                        ];
                        const images: { imageUrl: string }[] = [];
                        const currentOrigin = new URL(document.URL).origin;
                        for (const selector of pageImageSelectors) {
                            const elements = Array.from(document.querySelectorAll(selector));
                            if (elements.length > 0) {
                                elements.forEach(img => {
                                    const src = img.getAttribute('src') || img.getAttribute('data-src');
                                    if (src && (src.startsWith('http') || src.startsWith('/'))) {
                                        const absoluteSrc = src.startsWith('/') ? `${currentOrigin}${src}` : src;
                                        images.push({ imageUrl: absoluteSrc.trim() });
                                    }
                                });
                                if(images.length > 0) break; 
                            }
                        }
                        return images.filter((page, index, self) => index === self.findIndex((p) => p.imageUrl === page.imageUrl));
                    });
                    updatedManga.chapters[chIdx].pages = chapterPages; // Assign ke updatedManga
                    console.log(`[MangaScraper] Fetched ${chapterPages.length} pages for chapter "${chapterToFetch.title}".`);
                } catch (pageError) {
                    console.error(`[MangaScraper] Error fetching pages for chapter "${chapterToFetch.title}" (${chapterToFetch.url}):`, pageError);
                    updatedManga.chapters[chIdx].pages = []; 
                }
                await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500)); 
            }
        }

      } catch (detailError) {
        console.error(`[MangaScraper] Error fetching details for manga ${manga.title} (ID: ${manga.id}, URL: ${manga.url}):`, detailError);
      }
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500)); 
    }
    return detailedMangaList;
  } catch (error) {
    console.error('[MangaScraper] A critical error occurred:', error);
    return detailedMangaList;
  } finally {
    console.log('[MangaScraper] Closing browser.');
    if (browser) await browser.close();
  }
}