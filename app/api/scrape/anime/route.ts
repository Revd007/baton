import { NextResponse } from 'next/server';
import { scrapeAnime } from '../../../../lib/scrapers/anime'; // Path disesuaikan

export const dynamic = 'force-dynamic'; // Memberitahu Next.js untuk menjalankan ini secara dinamis

export async function GET(request: Request) {
  try {
    const data = await scrapeAnime(); 
    return NextResponse.json(data);
  } catch (error) {
    let errorMessage = 'An unknown error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error('[SCRAPE_ANIME_ERROR]', error);
    return NextResponse.json({ message: 'Error scraping anime', error: errorMessage }, { status: 500 });
  }
} 