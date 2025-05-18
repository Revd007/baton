import Link from "next/link";
// import Image from "next/image"; // Tidak lagi digunakan langsung di sini
// import { comicsContent, contentTypes, genres } from "@/lib/mock-data"; // Komentari atau hapus jika tidak digunakan lagi
// import { Card, CardContent } from "@/components/ui/card"; // Tidak lagi digunakan langsung di sini
// import { BookOpen, TrendingUp, Star, History, Filter } from "lucide-react"; // Mungkin sebagian tidak lagi digunakan
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Tidak lagi digunakan langsung di sini
// import { Button } from "@/components/ui/button"; // Tidak lagi digunakan langsung di sini
/*
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
*/
import db from "../../lib/db"; // Impor instance Knex
// import { MangaCardImage } from "@/components/manga-card-image"; // Digunakan di dalam client component
import { ComicsPageClientContent } from "./comics-client-page-content"; // Impor komponen client baru

export const metadata = {
  title: "Read Comics - Baton",
  description: "Read your favorite comics with a seamless scrolling experience",
};

// Interface ini sekarang merepresentasikan data dari database kita
interface MangaFromDB {
  id: string; // slug manga
  title: string;
  source_name?: string;
  source_url: string;
  cover_image_url?: string;
  author?: string;
  description?: string;
  type?: string;
  genres?: { name: string }[]; // Array of genre objects
  // chapters dan pages bisa ditambahkan jika ingin eager load, atau load terpisah saat dibutuhkan
}

async function getMangaDataFromDB(): Promise<MangaFromDB[]> {
  try {
    console.log('[ComicsPage] Fetching manga data from database...');
    const mangas = await db('mangas')
      .select(
        'mangas.id',
        'mangas.title',
        'mangas.source_url',
        'mangas.cover_image_url',
        'mangas.author',
        'mangas.description',
        'mangas.type'
      )
      .orderBy('mangas.updated_at', 'desc'); // Tampilkan yang terbaru diupdate

    // Untuk setiap manga, ambil genrenya
    const mangasWithGenres = await Promise.all(
      mangas.map(async (manga) => {
        const genres = await db('genres')
          .join('manga_genres', 'genres.id', '=', 'manga_genres.genre_id')
          .where('manga_genres.manga_id', manga.id)
          .select('genres.name');
        return { ...manga, genres };
      })
    );
    console.log(`[ComicsPage] Fetched ${mangasWithGenres.length} manga items from DB.`);
    return mangasWithGenres;
  } catch (error) {
    console.error('[ComicsPage] Error fetching manga data from DB:', error);
    return [];
  }
}

export default async function ComicsPage() {
  // Sekarang panggil fungsi yang mengambil dari DB
  const mangas = await getMangaDataFromDB();

  if (!mangas || mangas.length === 0) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="text-xl">No manga data available in the database.</p>
        <p className="text-sm text-gray-500">
          Try running a scraper first, e.g., by visiting <Link href="/api/scrape/komiku" className="text-blue-500 hover:underline">/api/scrape/komiku</Link> manually.
        </p>
      </div>
    );
  }

  // Ekstrak unique types dan genres
  const allTypes = mangas.map(m => m.type).filter(Boolean) as string[];
  const uniqueTypes = Array.from(new Set(allTypes));

  const allRawGenres = mangas.flatMap(m => m.genres?.map(g => g.name) || []);
  const allDefinedGenres = allRawGenres.filter(Boolean) as string[];
  const uniqueGenres = Array.from(new Set(allDefinedGenres)).sort();

  return (
    <div className="pt-20 pb-16 min-h-screen">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-start gap-8 mb-12">
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
              Read Comics
            </h1>
            <p className="text-lg text-muted-foreground">
              Discover and enjoy a vast collection of comics with our seamless reading experience
            </p>
          </div>
        </div>
        <ComicsPageClientContent 
          initialMangas={mangas} 
          uniqueTypes={uniqueTypes} 
          uniqueGenres={uniqueGenres} 
        />
      </div>
    </div>
  );
}

// Halaman ini sekarang mengambil data dari DB, jadi bisa di-cache atau direvalidasi secara berkala
// export const dynamic = 'force-dynamic'; // Tidak perlu lagi jika data dari DB
// export const revalidate = 3600; // Revalidate setiap jam, misalnya