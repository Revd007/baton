"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase, getHistory } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { History, Play, BookOpen, Clock } from "lucide-react";
import { streamingContent, comicsContent } from "@/lib/mock-data";
import { formatDistanceToNow } from "date-fns";

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }

      try {
        const history = await getHistory(user.id);
        setHistory(history);
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [router]);

  const videoHistory = history.filter((h) => h.content_type === "video");
  const comicHistory = history.filter((h) => h.content_type === "comic");

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
          <History className="w-8 h-8" />
          Watch & Read History
        </h1>

        <Tabs defaultValue="videos" className="space-y-8">
          <TabsList>
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              Videos ({videoHistory.length})
            </TabsTrigger>
            <TabsTrigger value="comics" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Comics ({comicHistory.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="videos">
            <div className="space-y-4">
              {videoHistory.map((item) => {
                const content = streamingContent.find(
                  (c) => c.id === item.content_id
                );
                if (!content) return null;

                const season = content.seasons.find((s) =>
                  s.episodes.some((e) => e.id === item.chapter_id)
                );
                const episode = season?.episodes.find(
                  (e) => e.id === item.chapter_id
                );

                return (
                  <Link
                    key={item.id}
                    href={`/stream/${content.id}/${season?.id}/${episode?.id}`}
                  >
                    <Card className="overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:shadow-lg">
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <div className="relative w-48 aspect-video rounded-md overflow-hidden">
                            <Image
                              src={episode?.thumbnail || content.thumbnail}
                              alt={content.title}
                              fill
                              className="object-cover"
                            />
                            {item.progress && (
                              <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
                                <div
                                  className="h-full bg-primary"
                                  style={{ width: `${item.progress * 100}%` }}
                                />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{content.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {episode?.title}
                            </p>
                            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              {formatDistanceToNow(new Date(item.last_accessed), {
                                addSuffix: true,
                              })}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="comics">
            <div className="space-y-4">
              {comicHistory.map((item) => {
                const content = comicsContent.find(
                  (c) => c.id === item.content_id
                );
                if (!content) return null;

                const chapter = content.chapters.find(
                  (c) => c.id === item.chapter_id
                );

                return (
                  <Link
                    key={item.id}
                    href={`/comics/${content.id}/${chapter?.id}`}
                  >
                    <Card className="overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:shadow-lg">
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <div className="relative w-32 aspect-[2/3] rounded-md overflow-hidden">
                            <Image
                              src={content.cover}
                              alt={content.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{content.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {chapter?.title}
                            </p>
                            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              {formatDistanceToNow(new Date(item.last_accessed), {
                                addSuffix: true,
                              })}
                            </div>
                          </div>
                        </div>
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