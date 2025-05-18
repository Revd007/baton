import { comicsContent } from "@/lib/mock-data";
import ComicReaderClient from "./comic-reader-client";

export async function generateStaticParams() {
  return comicsContent.flatMap((comic) =>
    comic.chapters.map((chapter) => ({
      comicId: comic.id,
      chapterId: chapter.id,
    }))
  );
}

export default function ComicReaderPage({ params }: { params: { comicId: string; chapterId: string } }) {
  return <ComicReaderClient params={params} />;
}