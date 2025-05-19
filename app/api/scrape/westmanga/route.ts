import { NextResponse } from 'next/server';
import { scrapeManga, MangaInfo } from '../../../../lib/scrapers/manga'; // Path ke scraper manga.ts
import db from '../../../../lib/db';

export const dynamic = 'force-dynamic';

async function saveMangaDataToDB(mangaData: MangaInfo[]) {
  if (!mangaData || mangaData.length === 0) {
    console.log('[DB_SAVE_WESTMANGA] No manga data to save.');
    return;
  }
  console.log(`[DB_SAVE_WESTMANGA] Starting to save/update ${mangaData.length} manga items from WestManga.`);

  for (const manga of mangaData) {
    if (!manga.url || !manga.id) {
        console.warn(`[DB_SAVE_WESTMANGA] Skipping manga without URL or ID: ${manga.title}`);
        continue;
    }

    try {
      await db.transaction(async (trx) => {
        const mangaDbId = manga.id; 
        // Cek apakah manga sudah ada berdasarkan source_url untuk WestManga
        const existingManga = await trx('mangas').where('source_url', manga.url).first();

        const mangaPayload = {
          id: mangaDbId, // Menggunakan ID dari scraper
          title: manga.title,
          source_name: manga.source || 'westmanga.me', // Ambil dari scraper atau default
          source_url: manga.url,
          cover_image_url: manga.cover,
          author: manga.author,
          description: manga.description,
          type: manga.type,
          last_scraped_at: new Date(),
        };

        if (existingManga) {
          await trx('mangas').where('id', existingManga.id).update({
            ...mangaPayload,
            updated_at: new Date(),
          });
          console.log(`[DB_SAVE_WESTMANGA] Updated manga: ${manga.title}`);
        } else {
          await trx('mangas').insert({
            ...mangaPayload,
            created_at: new Date(),
            updated_at: new Date(),
          });
          console.log(`[DB_SAVE_WESTMANGA] Inserted new manga: ${manga.title}`);
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
            const chapterDbId = chapter.id; // Slug chapter sebagai ID
            const existingChapter = await trx('chapters').where({ id: chapterDbId, manga_id: mangaDbId }).first();
            
            const chapterPayload: any = {
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
              await trx('chapters').where('id', existingChapter.id).update({ ...chapterPayload, updated_at: new Date() });
            } else {
              await trx('chapters').insert({ ...chapterPayload, created_at: new Date(), updated_at: new Date() });
            }

            // Simpan halaman (pages) untuk chapter ini
            if (chapter.pages && chapter.pages.length > 0) {
              console.log(`[DB_SAVE_WESTMANGA] Saving ${chapter.pages.length} pages for chapter ID: ${chapterDbId}`);
              await trx('pages').where('chapter_id', chapterDbId).del();
              const pagesToInsert = chapter.pages.map((page, index) => ({
                chapter_id: chapterDbId,
                page_number: index + 1, 
                image_url: page.imageUrl,
                created_at: new Date(),
                updated_at: new Date(),
              }));
              if (pagesToInsert.length > 0) {
                await trx('pages').insert(pagesToInsert);
                console.log(`[DB_SAVE_WESTMANGA] Successfully inserted ${pagesToInsert.length} pages for chapter ID: ${chapterDbId}`);
              }
            } else {
               await trx('pages').where('chapter_id', chapterDbId).del();
               console.log(`[DB_SAVE_WESTMANGA] No new pages for chapter ID: ${chapterDbId}, existing pages deleted.`);
            }
          }
        }
      });
      console.log(`[DB_SAVE_WESTMANGA] Successfully saved/updated manga and its details: ${manga.title}`);
    } catch (dbError) {
      console.error(`[DB_SAVE_WESTMANGA_ERROR] Error saving manga ${manga.title} (URL: ${manga.url}):`, dbError);
    }
  }
}

export async function GET(request: Request) {
  console.log('[API_SCRAPE_WESTMANGA] Received GET request.');
  try {
    console.log('[API_SCRAPE_WESTMANGA] Starting WestManga scrape...');
    const scrapedData = await scrapeManga(); 
    console.log(`[API_SCRAPE_WESTMANGA] WestManga scrape finished. Found ${scrapedData.length} items for detail processing.`);

    if (scrapedData && scrapedData.length > 0) {
      console.log('[API_SCRAPE_WESTMANGA] Proceeding to save data to DB...');
      await saveMangaDataToDB(scrapedData);
      console.log('[API_SCRAPE_WESTMANGA] Data saving process to DB completed for WestManga items.');
    } else {
      console.log('[API_SCRAPE_WESTMANGA] No data scraped from WestManga, skipping DB save.');
    }
    
    return NextResponse.json({ message: 'WestManga scraping and DB update process initiated.', count: scrapedData.length });
  } catch (error) {
    let errorMessage = 'An unknown error occurred during WestManga scraping or DB save';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error('[API_SCRAPE_WESTMANGA_ERROR]', error);
    return NextResponse.json({ message: 'Error scraping WestManga or saving to DB', error: errorMessage }, { status: 500 });
  }
} 