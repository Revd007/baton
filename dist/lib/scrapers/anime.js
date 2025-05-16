import puppeteer from 'puppeteer';
export async function scrapeAnime(url = 'https://9animetv.to/home') {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    try {
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle0' });
        const animeList = await page.evaluate(() => {
            const items = document.querySelectorAll('.film_list-wrap .flw-item');
            return Array.from(items).map(item => {
                var _a, _b, _c, _d, _e, _f;
                const link = ((_a = item.querySelector('.film-poster-ahref')) === null || _a === void 0 ? void 0 : _a.getAttribute('href')) || '';
                const thumbnail = ((_b = item.querySelector('img')) === null || _b === void 0 ? void 0 : _b.getAttribute('data-src')) || '';
                const title = ((_d = (_c = item.querySelector('.film-name')) === null || _c === void 0 ? void 0 : _c.textContent) === null || _d === void 0 ? void 0 : _d.trim()) || '';
                const type = ((_f = (_e = item.querySelector('.fd-infor .fdi-item')) === null || _e === void 0 ? void 0 : _e.textContent) === null || _f === void 0 ? void 0 : _f.trim()) || '';
                return {
                    id: link.split('/').pop() || '',
                    title,
                    type,
                    thumbnail,
                    description: '',
                    genres: [],
                    episodes: []
                };
            });
        });
        // Get additional details for each anime
        for (const anime of animeList) {
            if (!anime.id)
                continue;
            await page.goto(`https://9animetv.to/watch/${anime.id}`, { waitUntil: 'networkidle0' });
            const details = await page.evaluate(() => {
                var _a, _b;
                const description = ((_b = (_a = document.querySelector('.film-description')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim()) || '';
                const genres = Array.from(document.querySelectorAll('.film-info .genres a'))
                    .map(genre => { var _a; return ((_a = genre.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || ''; });
                const episodes = Array.from(document.querySelectorAll('.ss-list a')).map(ep => {
                    var _a, _b;
                    return ({
                        id: ((_a = ep.getAttribute('href')) === null || _a === void 0 ? void 0 : _a.split('/').pop()) || '',
                        title: ((_b = ep.textContent) === null || _b === void 0 ? void 0 : _b.trim()) || '',
                        thumbnail: '',
                        videoUrl: ep.getAttribute('href') || ''
                    });
                });
                return { description, genres, episodes };
            });
            anime.description = details.description;
            anime.genres = details.genres;
            anime.episodes = details.episodes;
        }
        return animeList;
    }
    finally {
        await browser.close();
    }
}
