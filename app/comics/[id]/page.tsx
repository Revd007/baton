import db from "@/lib/db";
import { MangaCardImage } from "@/components/manga-card-image";
import { notFound } from "next/navigation";

interface MangaDetailPageProps {
  params: {
    id: string; // Ini adalah slug/ID manga dari URL
  };
  // searchParams?: { [key: string]: string | string[] | undefined }; // Jika Anda butuh searchParams
}

interface ChapterInfo {
  id: string;
  chapter_number: number | null; // Diubah
  title?: string;
  // source_url akan diperlukan untuk membaca chapter
  source_url: string;
  created_at: Date;
}

interface MangaDetailsFromDB {
  id: string;
  title: string;
  source_url: string;
  cover_image_url?: string;
  author?: string;
  description?: string;
  type?: string;
  genres?: { name: string }[];
  chapters?: ChapterInfo[];
  updated_at?: Date;
}

async function getMangaDetails(id: string): Promise<MangaDetailsFromDB | null> {
  try {
    // console.log(`[MangaDetailPage] getMangaDetails called with id: ${id}`); // ID di sini sudah benar
    const manga = await db('mangas').where({ id }).first();
    // console.log(`[MangaDetailPage] Manga fetched from DB for id ${id}:`, manga ? manga.id : 'NOT FOUND');
    
    if (!manga) {
      // console.log(`[MangaDetailPage] No manga found for id: ${id}, returning null.`);
      return null;
    }

    const genres = await db('genres')
      .join('manga_genres', 'genres.id', '=', 'manga_genres.genre_id')
      .where('manga_genres.manga_id', manga.id)
      .select('genres.name');

    const chapters = await db('chapters')
      .where({ manga_id: manga.id })
      .orderByRaw('CAST(chapter_number AS FLOAT) DESC NULLS LAST, created_at DESC')
      .select('id', 'chapter_number', 'title', 'chapter_url as source_url', 'created_at');
    
    return { ...manga, genres, chapters } as MangaDetailsFromDB;
  } catch (error) {
    console.error(`Error fetching details for manga ${id}:`, error);
    return null;
  }
}

export async function generateMetadata(props: MangaDetailPageProps) { // Diubah: terima props
  const id = props.params.id; // Diubah: ambil id dari props
  // console.log(`[generateMetadata] ID from props: ${id}`); 
  const manga = await getMangaDetails(id);
  if (!manga) {
    return { title: "Manga Not Found" };
  }
  return { 
    title: `${manga.title} - Read Comics - Baton`,
    description: manga.description || `Details for ${manga.title}`
   };
}

export default async function MangaDetailPage(props: MangaDetailPageProps) { // Diubah: terima props
  const id = props.params.id; // Diubah: ambil id dari props

  console.log(`[MangaDetailPage] Page component rendering for id (from props): ${id}`);
  const manga = await getMangaDetails(id);

  // Log data chapters yang diterima
  if (manga && manga.chapters) {
    console.log("[MangaDetailPage] Chapters data received:", JSON.stringify(manga.chapters.map(c => ({ id: c.id, title: c.title, number: c.chapter_number, created_at: c.created_at })), null, 2));
  } else if (manga) {
    console.log("[MangaDetailPage] Manga data received, but no chapters found or chapters array is null.");
  } else {
    console.log("[MangaDetailPage] No manga data received (manga is null).");
  }

  if (!manga) {
    // console.log(`[MangaDetailPage] Manga not found after getMangaDetails for id: ${id}, calling notFound().`);
    notFound(); 
  }

  // console.log(`[MangaDetailPage] Rendering page for manga: ${manga.title}`);
  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          {manga.cover_image_url && (
            <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden shadow-lg mb-4">
              <MangaCardImage 
                src={manga.cover_image_url} 
                alt={`Cover for ${manga.title}`} 
                title={manga.title} 
              />
            </div>
          )}
        </div>
        <div className="md:col-span-2">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">{manga.title}</h1>
          {manga.author && <p className="text-lg text-muted-foreground mb-1">Author: {manga.author}</p>}
          {manga.type && (
            <span className="inline-block text-sm bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full mb-3">
              {manga.type}
            </span>
          )}
          {manga.genres && manga.genres.length > 0 && (
            <div className="mb-4">
              <h3 className="text-md font-semibold mb-1 text-muted-foreground">Genres:</h3>
              <div className="flex flex-wrap gap-2">
                {manga.genres.map(genre => (
                  <span key={genre.name} className="text-sm bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                    {genre.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          {manga.description && (
            <div className="mb-6">
              <h3 className="text-md font-semibold mb-1 text-muted-foreground">Synopsis:</h3>
              <p className="text-md text-foreground/90 whitespace-pre-wrap">{manga.description}</p>
            </div>
          )}
        </div>
      </div>

      {manga.chapters && manga.chapters.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">Chapter List</h2>
          <div className="border border-border rounded-lg">
            {manga.chapters.map((chapter, index) => (
              <div 
                key={chapter.id} 
                className={`p-4 flex justify-between items-center hover:bg-muted/50 transition-colors ${
                  index < manga.chapters!.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <div>
                  <h3 className="text-lg font-medium text-primary hover:underline">
                    {/* Nanti ini akan menjadi Link ke halaman baca chapter */}
                    {/* <Link href={`/comics/${id}/chapter/${chapter.id}`}> */}
                      {(() => {
                        const num = chapter.chapter_number;
                        const title = chapter.title;
                        if (num !== null && title) return `Chapter ${num} - ${title}`;
                        if (num !== null) return `Chapter ${num}`;
                        if (title) return title; 
                        return 'Chapter'; 
                      })()}
                    {/* </Link> */}
                  </h3>
                  {chapter.created_at && (
                    <p className="text-xs text-muted-foreground">
                      Released: {new Date(chapter.created_at).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {/* Optional: Tombol Read bisa di uncomment nanti */}
                {/* <Button variant="outline" size="sm" asChild>
                  <Link href={`/comics/${id}/chapter/${chapter.id}`}>Read</Link>
                </Button> */}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 