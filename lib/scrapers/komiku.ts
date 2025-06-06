import puppeteer, { Page } from 'puppeteer';

// Re-duplikasi interface MangaInfo untuk kemudahan, atau bisa diimpor dari file bersama jika ada
export interface MangaInfo {
  id: string; // slug dari URL
  title: string;
  type: string; // 'Manga', 'Manhwa', 'Manhua'
  cover: string; // URL gambar sampul
  author: string;
  description: string;
  genres: string[];
  chapters: {
    id: string; // slug dari URL chapter
    title: string;
    chapter_number?: number;
    url?: string;
    pages: { imageUrl: string; }[];
  }[];
  url?: string; // URL ke halaman detail manga/komik
  source?: string; // Nama sumber, misal 'komiku.id'
}

// Fungsi untuk scroll otomatis (tidak digunakan lagi, diganti dengan loop scroll manual)
// async function autoScroll(page: Page): Promise<void> { ... }

export async function scrapeKomiku(targetUrl: string = 'https://komiku.id/daftar-komik/'): Promise<MangaInfo[]> {
  console.log(`[KomikuScraper] Starting scrape for: ${targetUrl}`);
  const browser = await puppeteer.launch({
    headless: 'new' as any,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--start-maximized']
  });
  console.log(`[KomikuScraper] Browser launched.`);

  let page: Page | undefined;
  const initialKomikList: Partial<MangaInfo>[] = [];

  try {
    page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    // Menggunakan viewport yang lebih besar mungkin membantu memuat lebih banyak item sekaligus
    await page.setViewport({ width: 1920, height: 1080 }); 

    console.log(`[KomikuScraper] Navigating to ${targetUrl}`);
    await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 90000 });
    console.log(`[KomikuScraper] Page loaded: ${targetUrl}`);

    console.log('[KomikuScraper] Attempting to scroll and load all items...');
    let previousHeight = 0;
    let currentHeight = (await page.evaluate('document.body.scrollHeight')) as number; 
    let noChangeStreak = 0;
    const maxNoChangeStreak = 3; // Berhenti setelah 3x scroll tidak ada perubahan tinggi

    while (noChangeStreak < maxNoChangeStreak) {
      previousHeight = currentHeight;
      await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
      await new Promise(resolve => setTimeout(resolve, 3000)); // Waktu tunggu konten baru
      currentHeight = (await page.evaluate('document.body.scrollHeight')) as number; 

      if (currentHeight === previousHeight) {
        noChangeStreak++;
        console.log(`[KomikuScraper] Scroll: No height change (${noChangeStreak}/${maxNoChangeStreak}). Height: ${currentHeight}`);
      } else {
        noChangeStreak = 0; // Reset streak jika ada perubahan tinggi
        console.log(`[KomikuScraper] Scrolled. New height: ${currentHeight}`);
      }
    }
    console.log('[KomikuScraper] Finished dynamic scrolling. Final height: ', currentHeight);
    // Tambahkan jeda sedikit setelah scroll selesai sebelum ekstraksi, untuk memastikan semua rendering DOM selesai
    await new Promise(resolve => setTimeout(resolve, 1000)); 
    console.log('[KomikuScraper] Extracting list after final scroll pause...');

    const komikItems = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('div.ls4, div.ls1')); 
      console.log(`[KomikuScraper-Evaluate] Found ${items.length} potential komik blocks.`);
      const results: Partial<MangaInfo>[] = [];
      const baseUrl = 'https://komiku.id'; // Definisikan base URL

      items.forEach(item => {
        const titleElement = item.querySelector('h4 a');
        let relativeUrl = titleElement?.getAttribute('href') || '';
        const title = titleElement?.textContent?.trim() || '';
        
        // Pastikan URL adalah absolut
        const absoluteUrl = relativeUrl.startsWith('http') ? relativeUrl : (relativeUrl ? `${baseUrl}${relativeUrl}` : '');

        const typeElementContainer = item.querySelector('span.kotak, div.ls4jdl');
        let typeText = '';
        if(typeElementContainer){
            const typeSpan = typeElementContainer.querySelector('span:first-child');
            typeText = typeSpan?.textContent?.trim() || '';
        }

        if (!typeText) {
            const parentText = item.textContent?.toLowerCase() || '';
            if (parentText.includes('manhwa')) typeText = 'Manhwa';
            else if (parentText.includes('manhua')) typeText = 'Manhua';
        }

        if (title && absoluteUrl && (typeText === 'Manhwa' || typeText === 'Manhua')) {
          let id = '';
          if (absoluteUrl) {
            try {
              // Gunakan absoluteUrl untuk parsing ID
              const pathParts = new URL(absoluteUrl).pathname.split('/').filter(part => part);
              id = pathParts.pop() || ''; 
            } catch (e) {
              console.error(`[KomikuScraper-Evaluate] Error parsing URL for ID: ${absoluteUrl}`, e);
            }
          }
          if (!id && title) {
            id = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          }

          results.push({
            id,
            title,
            url: absoluteUrl, // Simpan URL absolut
            type: typeText,
            source: 'komiku.id',
            cover: '', 
            author: '', 
            description: '', 
            genres: [], 
            chapters: [], 
          });
        }
      });
      return results;
    });

    initialKomikList.push(...komikItems);
    console.log(`[KomikuScraper] Extracted ${initialKomikList.length} initial Manhwa/Manhua items from list page.`);

    // Detail fetching loop (akan diimplementasikan berikutnya)
    const detailedKomikList: MangaInfo[] = [];
    // Batasi untuk pengujian awal, hapus atau sesuaikan nanti
    const limitDetailFetch = initialKomikList.length; // Ambil semua item
    console.log(`[KomikuScraper] Attempting to fetch details for up to ${limitDetailFetch} komik items.`);

    for (let i = 0; i < limitDetailFetch; i++) {
        const komik = initialKomikList[i];
        if (!komik.url || !page) continue;
        console.log(`[KomikuScraper] (${i + 1}/${limitDetailFetch}) Fetching details for: ${komik.title} from ${komik.url}`);
        try {
            await page.goto(komik.url, { waitUntil: 'networkidle2', timeout: 600000 });
            const details = await page.evaluate(() => {
                const getText = (element: Element | null): string => element?.textContent?.trim() || '';
                const getAttribute = (element: Element | null, attr: string): string => element?.getAttribute(attr)?.trim() || '';

                let detailTitle = getText(document.querySelector('h1.title, #Judul h1'));
                if (detailTitle) {
                  detailTitle = detailTitle.replace(/^Komik\s+/i, "").trim();
                }
                const coverImage = getAttribute(document.querySelector('div.ims img, div.thumb img'), 'src');
                let author = '';
                const infoTableRows = document.querySelectorAll('table.inftable tr, table.tbl tr, .spe span, .infox .fmed');
                infoTableRows.forEach(row => {
                    const rowText = row.textContent?.toLowerCase() || '';
                    if (rowText.includes('author') || rowText.includes('pengarang') || rowText.includes('penulis')) {
                        let valueElement = row.querySelector('td:last-child, span a, span b, span i, a');
                        if (!valueElement && row.nextElementSibling) valueElement = row.nextElementSibling;
                        if(valueElement) author = getText(valueElement).replace(/Author:|Pengarang:|Penulis:/gi, '').trim();
                        if (author) return;
                    }
                });
                if (!author) {
                    const allText = document.body.innerText;
                    const authorMatch = allText.match(/(?:Author|Pengarang|Penulis)\s*:\s*([^\n,]+)/i);
                    if (authorMatch && authorMatch[1]) author = authorMatch[1].trim();
                }
                const descriptionElement = document.querySelector('#Sinopsis p, div.desc p, .series-synops p, div.entry-content p');
                const description = getText(descriptionElement); 
                const genres = Array.from(document.querySelectorAll('.genre-info a, ul.genre li a, .gnr a, .seriestogenre a')).map(el => getText(el)).filter(Boolean);
                
                const chapters: MangaInfo['chapters'] = [];
                document.querySelectorAll('#Daftar_Chapter td.judulseries a, .eps_lst li a, ul.clstyle li a, .chapterlist li a').forEach(chLinkEl => {
                    const chLink = chLinkEl as HTMLAnchorElement;
                    const chapterUrl = chLink.href;
                    const chapterTitleText = getText(chLink.querySelector('.chapternum, span')) || getText(chLink); 
                    const chapterTitle = chapterTitleText.replace(/\s+/g, ' ').trim();
                    let chapterId = '';
                    if (chapterUrl) {
                        try {
                            const pathParts = new URL(chapterUrl).pathname.split('/').filter(part => part);
                            chapterId = pathParts.pop() || '';
                        } catch(e){ /* ignore */ }
                    }
                    if (!chapterId && chapterTitle) chapterId = chapterTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                    let num = NaN;
                    const titleForNumberExtraction = chapterTitleText; 
                    const primaryMatch = titleForNumberExtraction.match(/(?:ch|chapter|episode|eps|#|bagian|vol|volume|bab)\.?\s*([\d\.-]+)/i);
                    if (primaryMatch && primaryMatch[1]) num = parseFloat(primaryMatch[1].split('-')[0]);
                    else {
                        const secondaryMatch = titleForNumberExtraction.match(/([\d\.-]+)/);
                        if (secondaryMatch && secondaryMatch[1]) num = parseFloat(secondaryMatch[1].split('-')[0]);
                    }
                    if (isNaN(num)) console.warn(`[KomikuScraper-Evaluate] Gagal parse nomor chapter dari teks: "${titleForNumberExtraction}". Judul: "${chapterTitle}"`);
                    else console.log(`[KomikuScraper-Evaluate] Berhasil parse nomor chapter: ${num} dari teks: "${titleForNumberExtraction}"`);
                    if(chapterId && chapterTitle && chapterUrl) chapters.push({ id: chapterId, title: chapterTitle, chapter_number: isNaN(num) ? undefined : num, url: chapterUrl, pages: [] });
                });
                return { detailTitle, coverImage, author, description, genres, chapters };
            });

            const finalKomikItem: MangaInfo = {
                id: komik.id!,
                title: details.detailTitle || (komik.title ? komik.title.replace(/^Komik\s+/i, "").trim() : "Unknown Title"),
                cover: details.coverImage || komik.cover!,
                author: details.author || komik.author!,
                description: details.description || komik.description!,
                genres: details.genres && details.genres.length > 0 ? details.genres : komik.genres!,
                chapters: details.chapters || komik.chapters!,
                url: komik.url!,
                source: komik.source || 'komiku.id',
            } as MangaInfo;

            // Fetch pages for each chapter
            if (finalKomikItem.chapters && finalKomikItem.chapters.length > 0 && page) {
                console.log(`[KomikuScraper] Attempting to fetch pages for ${finalKomikItem.chapters.length} chapters of "${finalKomikItem.title}"`);
                for (let chIdx = 0; chIdx < finalKomikItem.chapters.length; chIdx++) {
                    const chapterToFetch = finalKomikItem.chapters[chIdx];
                    if (!chapterToFetch.url) {
                        console.warn(`[KomikuScraper] Chapter "${chapterToFetch.title}" has no URL, skipping page fetching.`);
                        continue;
                    }
                    console.log(`[KomikuScraper] (${chIdx + 1}/${finalKomikItem.chapters.length}) Fetching pages for chapter: "${chapterToFetch.title}" from ${chapterToFetch.url}`);
                    try {
                        await page.goto(chapterToFetch.url, { waitUntil: 'networkidle2', timeout: 75000 }); // networkidle2 might be better for pages with many images
                        
                        // Scroll to bottom to trigger lazy loading
                        await page.evaluate(async () => {
                            await new Promise<void>((resolve) => {
                                let totalHeight = 0;
                                const distance = 200;
                                const timer = setInterval(() => {
                                    const scrollHeight = document.body.scrollHeight;
                                    window.scrollBy(0, distance);
                                    totalHeight += distance;
                                    if (totalHeight >= scrollHeight - window.innerHeight) {
                                        clearInterval(timer);
                                        resolve();
                                    }
                                }, 100);
                            });
                        });
                        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for images to load after scroll

                        const chapterPages = await page.evaluate(() => {
                            const pageImageSelectors = [
                                '#Baca_Komik img', // Komiku specific
                                '.img_container img', // Common
                                '.reader-area img', 
                                '#readerarea img', 
                                '.comic_page img', 
                                '.wp-block-image img', 
                                '.ts-main-image', 
                                '#imagen_actual', 
                                '.main-img', 
                                '.reading-content img', 
                                '.page-break img', 
                                '.iv-card img[src]' // Specific for some sites
                            ];
                            const images: { imageUrl: string }[] = [];
                            for (const selector of pageImageSelectors) {
                                const elements = Array.from(document.querySelectorAll(selector));
                                if (elements.length > 0) {
                                    elements.forEach(img => {
                                        const src = img.getAttribute('src') || img.getAttribute('data-src');
                                        if (src && (src.startsWith('http') || src.startsWith('/'))) {
                                             // Handle relative URLs if necessary, assuming Komiku uses absolute or easily resolvable relative URLs for pages
                                            const absoluteSrc = src.startsWith('/') ? `${new URL(document.URL).origin}${src}` : src;
                                            images.push({ imageUrl: absoluteSrc.trim() });
                                        }
                                    });
                                    if(images.length > 0) break; // Stop if images found with this selector
                                }
                            }
                            // Remove duplicates that might occur if multiple selectors match same images
                            return images.filter((page, index, self) => 
                                index === self.findIndex((p) => p.imageUrl === page.imageUrl)
                            );
                        });
                        finalKomikItem.chapters[chIdx].pages = chapterPages;
                        console.log(`[KomikuScraper] Fetched ${chapterPages.length} pages for chapter "${chapterToFetch.title}".`);
                    } catch (pageError) {
                        console.error(`[KomikuScraper] Error fetching pages for chapter "${chapterToFetch.title}" (${chapterToFetch.url}):`, pageError);
                        finalKomikItem.chapters[chIdx].pages = []; // Ensure pages is an empty array on error
                    }
                    // Small delay between fetching pages for each chapter
                    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500)); 
                }
            }

            detailedKomikList.push(finalKomikItem);
            console.log(`[KomikuScraper] Successfully processed manga: ${finalKomikItem.title}`);

        } catch (detailError) {
            console.error(`[KomikuScraper] Error fetching details for ${komik.title} (${komik.url}):`, detailError);
        }
    }

    console.log(`[KomikuScraper] Finished scraping. Found ${detailedKomikList.length} Manhwa/Manhua items with details.`);
    return detailedKomikList;

  } catch (error) {
    console.error('[KomikuScraper] A critical error occurred:', error);
    return [];
  } finally {
    console.log('[KomikuScraper] Closing browser.');
    if (browser) await browser.close();
  }
}

// Contoh pemanggilan (untuk testing lokal jika perlu)
/*
(async () => {
  const data = await scrapeKomiku();
  console.log(JSON.stringify(data, null, 2));
})();
*/ 