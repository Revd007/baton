import { NextResponse } from 'next/server';
import { scrapeManga, MangaInfo } from '../../../../lib/scrapers/manga'; // Path disesuaikan
import db from '../../../../lib/db'; // Impor instance Knex

export const dynamic = 'force-dynamic'; // Memberitahu Next.js untuk menjalankan ini secara dinamis

async function saveMangaDataToDB(mangaData: MangaInfo[]) {
  if (!mangaData || mangaData.length === 0) {
    console.log('[DB_SAVE] No manga data to save.');
    return;
  }
  console.log(`[DB_SAVE] Starting to save/update ${mangaData.length} manga items.`);

  for (const manga of mangaData) {
    try {
      await db.transaction(async (trx) => {
        const mangaDbId = manga.id; 

        const mangaPayload = {
          id: mangaDbId,
          title: manga.title.replace(/^Komik\s+/i, "").trim(), // Bersihkan judul di sini juga
          source_name: 'westmanga', 
          source_url: manga.url,
          cover_image_url: manga.cover,
          author: manga.author,
          description: manga.description,
          type: manga.type,
          last_scraped_at: new Date(),
          updated_at: new Date(),
        };

        // Gunakan onConflict.merge() untuk upsert
        const result = await trx('mangas')
          .insert({ ...mangaPayload, created_at: new Date() })
          .onConflict('id')
          .merge([
            'title',
            'source_name', 
            'source_url',
            'cover_image_url',
            'author',
            'description',
            'type',
            'last_scraped_at',
            'updated_at'
          ]);
        
        // Log bahwa operasi upsert telah dilakukan
        // Detail spesifik tentang insert vs update tidak selalu mudah didapatkan secara konsisten dari Knex onConflict.merge()
        console.log(`[DB_SAVE] Upserted manga (or attempted to): ${mangaPayload.title} (ID: ${mangaDbId})`);

        // 2. Handle Genres
        if (manga.genres && manga.genres.length > 0) {
          // Hapus genre lama untuk manga ini agar sinkron
          await trx('manga_genres').where('manga_id', mangaDbId).del();

          for (const genreName of manga.genres) {
            let genre = await trx('genres').where('name', genreName).first();
            if (!genre) {
              [genre] = await trx('genres').insert({ name: genreName, created_at: new Date(), updated_at: new Date() }).returning('*');
            }
            // Hubungkan manga dengan genre
            await trx('manga_genres').insert({
              manga_id: mangaDbId,
              genre_id: genre.id,
              created_at: new Date(),
              updated_at: new Date(),
            }).onConflict(['manga_id', 'genre_id']).ignore(); // Abaikan jika sudah ada
          }
        }

        // 3. Handle Chapters and Pages
        if (manga.chapters && manga.chapters.length > 0) {
          for (const chapter of manga.chapters) {
            const chapterDbId = chapter.id; // Slug chapter
            // const existingChapter = await trx('chapters').where('chapter_url', chapter.url).first(); // Cek berdasarkan id chapter dan manga_id
            
            const chapterPayload = {
                id: chapterDbId,
                manga_id: mangaDbId,
                title: chapter.title,
                chapter_number: chapter.title.match(/Chapter (\d+(\.\d+)?)/i)?.[1] || chapter.title, // Ekstrak nomor chapter jika ada
                // chapter_url: chapter.url, // Ganti dengan source_url agar konsisten
                source_url: chapter.url,
                scraped_at: new Date(),
                updated_at: new Date(),
            };

            // Upsert Chapter
            await trx('chapters')
              .insert({ ...chapterPayload, created_at: new Date() })
              .onConflict(['id', 'manga_id']) // Asumsi kombinasi id chapter dan manga_id unik
              .merge([
                  'title',
                  'chapter_number',
                  'source_url',
                  'scraped_at',
                  'updated_at'
              ]);

            // 4. Handle Pages for the chapter
            if (chapter.pages && chapter.pages.length > 0) {
              // Hapus halaman lama untuk chapter ini agar sinkron (jika ada perubahan jumlah halaman)
              await trx('pages').where('chapter_id', chapterDbId).del();
              
              const pagesToInsert = chapter.pages.map((page, index) => ({
                chapter_id: chapterDbId,
                page_number: index + 1, // Asumsikan urutan dari scraper sudah benar
                image_url: page.imageUrl,
                created_at: new Date(),
                updated_at: new Date(),
              }));
              
              if (pagesToInsert.length > 0) {
                 // Batch insert untuk pages
                await trx('pages').insert(pagesToInsert)
                  // .onConflict(['chapter_id', 'page_number']).ignore(); // Jika ingin update, gunakan merge
                  .onConflict(['chapter_id', 'page_number'])
                  .merge(['image_url', 'updated_at']);
              }
            }
          }
        }
      });
      console.log(`[DB_SAVE] Successfully saved/updated manga and its details: ${manga.title}`);
    } catch (dbError) {
      console.error(`[DB_SAVE_ERROR] Error saving manga ${manga.title} (URL: ${manga.url}):`, dbError);
    }
  }
}

export async function GET(request: Request) {
  console.log('[API_SCRAPE_MANGA] Received GET request.');
  try {
    console.log('[API_SCRAPE_MANGA] Starting manga scrape...');
    const scrapedData = await scrapeManga();
    console.log(`[API_SCRAPE_MANGA] Manga scrape finished. Found ${scrapedData.length} items.`);

    if (scrapedData && scrapedData.length > 0) {
      console.log('[API_SCRAPE_MANGA] Proceeding to save data to DB...');
      await saveMangaDataToDB(scrapedData);
      console.log('[API_SCRAPE_MANGA] Data saving process to DB completed.');
    } else {
      console.log('[API_SCRAPE_MANGA] No data scraped, skipping DB save.');
    }
    
    // Mengembalikan data yang baru di-scrape (atau bisa juga pesan sukses)
    return NextResponse.json({ message: 'Scraping and DB update complete.', count: scrapedData.length, data: scrapedData });
  } catch (error) {
    let errorMessage = 'An unknown error occurred during scraping or DB save';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error('[API_SCRAPE_MANGA_ERROR]', error);
    return NextResponse.json({ message: 'Error scraping manga or saving to DB', error: errorMessage }, { status: 500 });
  }
} 