import db from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image"; // Untuk menampilkan gambar chapter

interface ChapterReadingPageProps {
  params: {
    id: string; // Manga slug
    chapterId: string; // Chapter slug
  };
}

interface PageInfo {
  id: number; // page id from DB
  page_number: number;
  image_url: string;
}

interface ChapterReadingData {
  mangaTitle: string;
  mangaSlug: string;
  chapterTitle?: string | null;
  chapterNumber?: number | null;
  pages: PageInfo[];
}

async function getChapterReadingData(
  mangaSlug: string,
  chapterSlug: string
): Promise<ChapterReadingData | null> {
  try {
    const manga = await db("mangas").where({ id: mangaSlug }).first("id", "title");
    if (!manga) {
      console.warn(`[ChapterReadingPage] Manga not found with slug: ${mangaSlug}`);
      return null;
    }

    const chapter = await db("chapters")
      .where({ id: chapterSlug, manga_id: mangaSlug })
      .first("id", "title", "chapter_number");

    if (!chapter) {
      console.warn(
        `[ChapterReadingPage] Chapter not found with slug: ${chapterSlug} for manga: ${mangaSlug}`
      );
      return null;
    }

    const pages = await db("pages")
      .where({ chapter_id: chapter.id }) // chapter.id adalah slug chapter
      .orderBy("page_number", "asc")
      .select("id", "page_number", "image_url");

    console.log(
      `[ChapterReadingPage] Fetched ${pages.length} pages for chapter: ${chapterSlug}`
    );

    return {
      mangaTitle: manga.title,
      mangaSlug: manga.id,
      chapterTitle: chapter.title,
      chapterNumber: chapter.chapter_number,
      pages,
    };
  } catch (error) {
    console.error(
      `[ChapterReadingPage] Error fetching data for manga ${mangaSlug}, chapter ${chapterSlug}:`,
      error
    );
    return null;
  }
}

export async function generateMetadata({ params }: ChapterReadingPageProps) {
  const data = await getChapterReadingData(params.id, params.chapterId);
  if (!data) {
    return { title: "Chapter Not Found" };
  }
  const chapterDisplay = data.chapterNumber
    ? `Chapter ${data.chapterNumber}`
    : data.chapterTitle || "Chapter";
  return {
    title: `${chapterDisplay} - ${data.mangaTitle} - Baton`,
  };
}

export default async function ChapterReadingPage({
  params,
}: ChapterReadingPageProps) {
  const data = await getChapterReadingData(params.id, params.chapterId);

  if (!data) {
    notFound();
  }

  const chapterDisplay =
    data.chapterNumber !== null && data.chapterTitle
      ? `Chapter ${data.chapterNumber} - ${data.chapterTitle}`
      : data.chapterNumber !== null
      ? `Chapter ${data.chapterNumber}`
      : data.chapterTitle
      ? data.chapterTitle
      : "Chapter";

  return (
    <div className="container mx-auto px-2 py-4 md:px-0">
      <div className="mb-6 bg-card p-4 rounded-lg shadow">
        <Link
          href={`/comics/${data.mangaSlug}`}
          className="text-sm text-primary hover:underline"
        >
          &larr; Back to {data.mangaTitle}
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-center my-2">
          {data.mangaTitle}
        </h1>
        <h2 className="text-xl md:text-2xl text-muted-foreground text-center">
          {chapterDisplay}
        </h2>
      </div>

      {data.pages && data.pages.length > 0 ? (
        <div className="flex flex-col items-center space-y-1 bg-background">
          {data.pages.map((page) => (
            <div key={page.id} className="relative w-full max-w-3xl">
              {/* 
                Kita menggunakan Image component dari Next.js untuk optimasi, 
                tapi ini memerlukan width dan height. 
                Jika tidak ada, kita bisa pakai <img> biasa atau atur layout fixed.
                Untuk sekarang, kita asumsikan gambar bisa di-load dan akan menyesuaikan lebar.
                Tambahkan styling agar tidak terlalu lebar di desktop.
              */}
              <img
                src={page.image_url}
                alt={`Page ${page.page_number}`}
                className="w-full h-auto object-contain"
                // Untuk Next/Image, Anda mungkin perlu width & height dari API atau default
                // width={800} 
                // height={1200}
                // layout="responsive" // atau fill, intrinsic
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-xl text-muted-foreground">
            No pages found for this chapter.
          </p>
          <p className="mt-2 text-sm">
            The pages might not have been scraped yet.
          </p>
        </div>
      )}

      {/* TODO: Add Next/Previous Chapter Navigation */}
      <div className="mt-8 text-center">
        <Link
          href={`/comics/${data.mangaSlug}`}
          className="text-sm text-primary hover:underline"
        >
          &larr; Back to {data.mangaTitle}
        </Link>
      </div>
    </div>
  );
} 