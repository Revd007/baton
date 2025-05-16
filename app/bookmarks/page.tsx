"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase, getBookmarks } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bookmark, Play, BookOpen } from "lucide-react";
import { streamingContent, comicsContent } from "@/lib/mock-data";

export default function BookmarksPage() {
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookmarks = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }

      try {
        const bookmarks = await getBookmarks(user.id);
        setBookmarks(bookmarks);
      } catch (error) {
        console.error("Error fetching bookmarks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarks();
  }, [router]);

  const videoBookmarks = bookmarks.filter((b) => b.content_type === "video");
  const comicBookmarks = bookmarks.filter((b) => b.content_type === "comic");

  if (loading) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="pt-20 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 flex items-center gap-2">
          <Bookmark className="w-8 h-8" />
          Your Bookmarks
        </h1>

        <Tabs defaultValue="videos" className="space-y-8">
          <TabsList>
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              Videos ({videoBookmarks.length})
            </TabsTrigger>
            <TabsTrigger value="comics" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Comics ({comicBookmarks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="videos">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {videoBookmarks.map((bookmark) => {
                const content = streamingContent.find(
                  (c) => c.id === bookmark.content_id
                );
                if (!content) return null;

                return (
                  <Link
                    key={bookmark.id}
                    href={`/stream/${content.id}/${content.seasons[0].id}/${content.seasons[0].episodes[0].id}`}
                  >
                    <Card className="overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                      <div className="relative aspect-video">
                        <Image
                          src={content.thumbnail}
                          alt={content.title}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2">{content.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {content.description}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="comics">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {comicBookmarks.map((bookmark) => {
                const content = comicsContent.find(
                  (c) => c.id === bookmark.content_id
                );
                if (!content) return null;

                return (
                  <Link
                    key={bookmark.id}
                    href={`/comics/${content.id}/${content.chapters[0].id}`}
                  >
                    <Card className="overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                      <div className="relative aspect-[2/3]">
                        <Image
                          src={content.cover}
                          alt={content.title}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2">{content.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {content.description}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}