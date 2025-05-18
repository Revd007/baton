import { NextResponse } from 'next/server';
import { scrapeKomiku, MangaInfo } from '../../../../lib/scrapers/komiku'; // Sesuaikan path jika perlu
import db from '../../../../lib/db'; // Impor instance Knex

export const dynamic = 'force-dynamic';

// Fungsi ini mirip dengan yang ada di route WestManga, namun disesuaikan untuk Komiku
// Pertimbangkan untuk membuat fungsi helper generik jika logikanya sangat mirip
async function saveKomikuDataToDB(mangaData: MangaInfo[]) {
  if (!mangaData || mangaData.length === 0) {
    console.log('[DB_SAVE_KOMIKU] No manga data to save.');
    return;
  }
  console.log(`[DB_SAVE_KOMIKU] Starting to save/update ${mangaData.length} komik items from Komiku.id.`);

  for (const manga of mangaData) {
    if (!manga.url) {
        console.warn(`[DB_SAVE_KOMIKU] Skipping manga without URL: ${manga.title}`);
        continue;
    }
    if (!manga.id) {
        console.warn(`[DB_SAVE_KOMIKU] Skipping manga without ID: ${manga.title}`);
        continue;
    }

    try {
      await db.transaction(async (trx) => {
        const mangaDbId = manga.id;
        const existingManga = await trx('mangas').where('source_url', manga.url).first();

        const mangaPayload = {
          id: mangaDbId,
          title: manga.title,
          source_name: 'komiku.id', // Spesifik untuk sumber ini
          source_url: manga.url,
          cover_image_url: manga.cover,
          author: manga.author,
          description: manga.description,
          type: manga.type, // 'Manhwa' atau 'Manhua'
          last_scraped_at: new Date(),
        };

        if (existingManga) {
          await trx('mangas').where('id', existingManga.id).update({
            ...mangaPayload,
            updated_at: new Date(),
          });
          console.log(`[DB_SAVE_KOMIKU] Updated manga: ${manga.title}`);
        } else {
          await trx('mangas').insert({
            ...mangaPayload,
            created_at: new Date(),
            updated_at: new Date(),
          });
          console.log(`[DB_SAVE_KOMIKU] Inserted new manga: ${manga.title}`);
        }

        if (manga.genres && manga.genres.length > 0) {
          await trx('manga_genres').where('manga_id', mangaDbId).del();
          for (const genreName of manga.genres) {
            let genre = await trx('genres').where('name', genreName).first();
            if (!genre) {
              [genre] = await trx('genres').insert({ name: genreName, created_at: new Date(), updated_at: new Date() }).returning('*');
            }
            await trx('manga_genres').insert({
              manga_id: mangaDbId,
              genre_id: genre.id,
              created_at: new Date(),
              updated_at: new Date(),
            }).onConflict(['manga_id', 'genre_id']).ignore();
          }
        }

        if (manga.chapters && manga.chapters.length > 0) {
          for (const chapter of manga.chapters) {
            if(!chapter.url || !chapter.id) continue;
            const chapterDbId = chapter.id;
            const existingChapter = await trx('chapters').where('chapter_url', chapter.url).first();
            
            const chapterPayload: { 
                id: string;
                manga_id: string;
                title: string;
                chapter_url: string;
                scraped_at: Date;
                chapter_number?: number | null;
             } = {
                id: chapterDbId,
                manga_id: mangaDbId,
                title: chapter.title,
                chapter_url: chapter.url,
                scraped_at: new Date(),
            };

            if (typeof chapter.chapter_number === 'number' && !isNaN(chapter.chapter_number)) {
                chapterPayload.chapter_number = chapter.chapter_number;
            } else {
                chapterPayload.chapter_number = null;
            }

            if (existingChapter) {
              await trx('chapters').where('id', existingChapter.id).update({
                ...chapterPayload,
                updated_at: new Date(),
              });
            } else {
              await trx('chapters').insert({
                ...chapterPayload,
                created_at: new Date(), 
                updated_at: new Date(),
              });
            }

            if (chapter.pages && chapter.pages.length > 0) {
              await trx('pages').where('chapter_id', chapterDbId).del();
              const pagesToInsert = chapter.pages.map((page, index) => ({
                chapter_id: chapterDbId,
                page_number: index + 1, 
                image_url: page.imageUrl,
                created_at: new Date(),
                updated_at: new Date(),
              }));
              if (pagesToInsert.length > 0) {
                await trx('pages').insert(pagesToInsert).onConflict(['chapter_id', 'page_number']).ignore();
              }
            }
          }
        }
      });
      console.log(`[DB_SAVE_KOMIKU] Successfully saved/updated komik and its details: ${manga.title}`);
    } catch (dbError) {
      console.error(`[DB_SAVE_KOMIKU_ERROR] Error saving komik ${manga.title} (URL: ${manga.url}):`, dbError);
    }
  }
}

export async function GET(request: Request) {
  console.log('[API_SCRAPE_KOMIKU] Received GET request.');
  try {
    console.log('[API_SCRAPE_KOMIKU] Starting komiku.id scrape...');
    const scrapedData = await scrapeKomiku(); // Panggil scraper Komiku
    console.log(`[API_SCRAPE_KOMIKU] Komiku.id scrape finished. Found ${scrapedData.length} items for detail processing.`);

    if (scrapedData && scrapedData.length > 0) {
      console.log('[API_SCRAPE_KOMIKU] Proceeding to save data to DB...');
      await saveKomikuDataToDB(scrapedData);
      console.log('[API_SCRAPE_KOMIKU] Data saving process to DB completed for Komiku.id items.');
    } else {
      console.log('[API_SCRAPE_KOMIKU] No data scraped from Komiku.id, skipping DB save.');
    }
    
    return NextResponse.json({ message: 'Komiku.id scraping and DB update process initiated.', count: scrapedData.length, data: scrapedData });
  } catch (error) {
    let errorMessage = 'An unknown error occurred during Komiku.id scraping or DB save';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error('[API_SCRAPE_KOMIKU_ERROR]', error);
    return NextResponse.json({ message: 'Error scraping Komiku.id or saving to DB', error: errorMessage }, { status: 500 });
  }
} 