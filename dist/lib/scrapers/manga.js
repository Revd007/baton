import puppeteer from 'puppeteer';
export async function scrapeManga(url = 'https://westmanga.me') {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    try {
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle0' });
        const mangaList = await page.evaluate(() => {
            const items = document.querySelectorAll('.listupd .bs');
            return Array.from(items).map(item => {
                var _a, _b, _c, _d, _e, _f;
                const link = ((_a = item.querySelector('a')) === null || _a === void 0 ? void 0 : _a.getAttribute('href')) || '';
                const cover = ((_b = item.querySelector('img')) === null || _b === void 0 ? void 0 : _b.getAttribute('src')) || '';
                const title = ((_d = (_c = item.querySelector('.tt')) === null || _c === void 0 ? void 0 : _c.textContent) === null || _d === void 0 ? void 0 : _d.trim()) || '';
                const type = ((_f = (_e = item.querySelector('.type')) === null || _e === void 0 ? void 0 : _e.textContent) === null || _f === void 0 ? void 0 : _f.trim()) || '';
                return {
                    id: link.split('/').pop() || '',
                    title,
                    type,
                    cover,
                    author: '',
                    description: '',
                    genres: [],
                    chapters: []
                };
            });
        });
        // Get additional details for each manga
        for (const manga of mangaList) {
            if (!manga.id)
                continue;
            await page.goto(`https://westmanga.me/manga/${manga.id}`, { waitUntil: 'networkidle0' });
            const details = await page.evaluate(() => {
                var _a, _b, _c, _d;
                const description = ((_b = (_a = document.querySelector('.entry-content')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim()) || '';
                const author = ((_d = (_c = document.querySelector('.infox .fmed')) === null || _c === void 0 ? void 0 : _c.textContent) === null || _d === void 0 ? void 0 : _d.trim()) || '';
                const genres = Array.from(document.querySelectorAll('.genre-info a'))
                    .map(genre => { var _a; return ((_a = genre.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || ''; });
                const chapters = Array.from(document.querySelectorAll('#chapterlist li')).map(ch => {
                    var _a, _b, _c, _d;
                    return ({
                        id: ((_b = (_a = ch.querySelector('a')) === null || _a === void 0 ? void 0 : _a.getAttribute('href')) === null || _b === void 0 ? void 0 : _b.split('/').pop()) || '',
                        title: ((_d = (_c = ch.querySelector('a')) === null || _c === void 0 ? void 0 : _c.textContent) === null || _d === void 0 ? void 0 : _d.trim()) || '',
                        pages: []
                    });
                });
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
    }
    finally {
        await browser.close();
    }
}
