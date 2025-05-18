"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { comicsContent } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Menu, X, ArrowUp } from "lucide-react";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";

interface ComicReaderClientProps {
  params: {
    comicId: string;
    chapterId: string;
  };
}

export default function ComicReaderClient({ params }: ComicReaderClientProps) {
  const router = useRouter();
  const [showControls, setShowControls] = useState(true);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isBottomVisible = useIntersectionObserver({
    ref: bottomRef,
    options: { threshold: 0.5 },
  });
  const [hasAutoNavigated, setHasAutoNavigated] = useState(false);

  const comicId = params.comicId;
  const chapterId = params.chapterId;

  const comic = comicsContent.find((c) => c.id === comicId);
  const chapter = comic?.chapters.find((c) => c.id === chapterId);

  const chapterIndex = comic?.chapters.findIndex((c) => c.id === chapterId) ?? -1;
  const prevChapter = chapterIndex > 0 ? comic?.chapters[chapterIndex - 1] : null;
  const nextChapter =
    chapterIndex < (comic?.chapters.length ?? 0) - 1
      ? comic?.chapters[chapterIndex + 1]
      : null;

  useEffect(() => {
    if (isBottomVisible && nextChapter && !hasAutoNavigated) {
      setHasAutoNavigated(true);
      router.push(`/comics/${comicId}/${nextChapter.id}`);
    }
  }, [isBottomVisible, nextChapter, comicId, router, hasAutoNavigated]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollToTop(true);
      } else {
        setShowScrollToTop(false);
      }

      if (window.scrollY > 100) {
        setShowControls(false);
      } else {
        setShowControls(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Reset scroll position when chapter changes
    window.scrollTo(0, 0);
    setHasAutoNavigated(false);
  }, [chapterId]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!comic || !chapter) {
    return (
      <div className="pt-20 h-screen flex items-center justify-center">
        <p>Comic not found</p>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen bg-background">
      {/* Top controls */}
      <div
        className={`fixed top-16 left-0 right-0 bg-background/95 backdrop-blur-sm z-40 transition-transform duration-300 ${
          showControls ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/comics")}
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <h1 className="text-lg font-semibold hidden sm:block">
              {comic.title} - {chapter.title}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/comics/${comicId}/${prevChapter?.id}`)}
              disabled={!prevChapter}
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Previous
            </Button>
            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="outline" size="sm">
                  <Menu className="mr-2 h-4 w-4" /> Chapters
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <div className="px-4 py-6 max-h-[70vh] overflow-y-auto">
                  <h2 className="font-bold text-lg mb-4">{comic.title}</h2>
                  <div className="space-y-1">
                    {comic.chapters.map((c) => (
                      <Link
                        key={c.id}
                        href={`/comics/${comicId}/${c.id}`}
                        className={`block px-3 py-2 rounded-md ${
                          c.id === chapterId
                            ? "bg-primary/10 text-primary font-medium"
                            : "hover:bg-muted"
                        }`}
                      >
                        {c.title}
                      </Link>
                    ))}
                  </div>
                </div>
              </DrawerContent>
            </Drawer>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/comics/${comicId}/${nextChapter?.id}`)}
              disabled={!nextChapter}
            >
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Comic content */}
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-3xl">
          {chapter.pages.map((page, index) => (
            <div key={page.id} className="mb-4">
              <div className="relative aspect-auto rounded-md overflow-hidden bg-muted">
                <Image
                  src={page.imageUrl}
                  alt={`Page ${index + 1}`}
                  width={800}
                  height={1200}
                  loading="lazy"
                  className="w-full h-auto"
                />
              </div>
            </div>
          ))}

          {/* Chapter navigation at bottom */}
          <div className="my-8 flex items-center justify-center gap-4">
            {prevChapter && (
              <Button
                onClick={() => router.push(`/comics/${comicId}/${prevChapter.id}`)}
              >
                <ChevronLeft className="mr-2 h-4 w-4" /> Previous Chapter
              </Button>
            )}
            {nextChapter && (
              <Button
                onClick={() => router.push(`/comics/${comicId}/${nextChapter.id}`)}
              >
                Next Chapter <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Bottom observer for auto-loading next chapter */}
          <div ref={bottomRef} className="h-20"></div>
        </div>
      </div>

      {/* Scroll to top button */}
      {showScrollToTop && (
        <Button
          variant="secondary"
          size="icon"
          className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg"
          onClick={scrollToTop}
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}