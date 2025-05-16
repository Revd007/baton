"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { streamingContent, streamingComments } from "@/lib/mock-data";
import {
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VideoPlayer from "@/components/video-player";
import CommentsList from "@/components/comments-list";

interface EpisodeClientProps {
  params: {
    contentId: string;
    seasonId: string;
    episodeId: string;
  };
}

export default function EpisodeClient({ params }: EpisodeClientProps) {
  const router = useRouter();
  const [showComments, setShowComments] = useState(false);
  const [currentQuality, setCurrentQuality] = useState("720p");

  const contentId = params.contentId;
  const seasonId = params.seasonId;
  const episodeId = params.episodeId;

  const content = streamingContent.find((c) => c.id === contentId);
  const season = content?.seasons.find((s) => s.id === seasonId);
  const episode = season?.episodes.find((e) => e.id === episodeId);

  const allEpisodes = content?.seasons.flatMap((s) => s.episodes) || [];
  const currentEpisodeIndex = allEpisodes.findIndex((e) => e.id === episodeId);
  const prevEpisode = currentEpisodeIndex > 0 ? allEpisodes[currentEpisodeIndex - 1] : null;
  const nextEpisode =
    currentEpisodeIndex < allEpisodes.length - 1
      ? allEpisodes[currentEpisodeIndex + 1]
      : null;

  const handleNextEpisode = () => {
    if (nextEpisode) {
      const nextSeasonId = content?.seasons.find((s) =>
        s.episodes.some((e) => e.id === nextEpisode.id)
      )?.id;
      router.push(`/stream/${contentId}/${nextSeasonId}/${nextEpisode.id}`);
    }
  };

  const handlePrevEpisode = () => {
    if (prevEpisode) {
      const prevSeasonId = content?.seasons.find((s) =>
        s.episodes.some((e) => e.id === prevEpisode.id)
      )?.id;
      router.push(`/stream/${contentId}/${prevSeasonId}/${prevEpisode.id}`);
    }
  };

  if (!content || !season || !episode) {
    return (
      <div className="pt-20 h-screen flex items-center justify-center">
        <p>Episode not found</p>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => router.push("/stream")}
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Back to All Videos
        </Button>

        <div className="flex flex-col md:flex-row gap-4 lg:gap-6">
          {/* Main Content */}
          <div className="flex-1">
            <div className="relative bg-black rounded-lg overflow-hidden">
              <VideoPlayer
                videoUrl={episode.videoUrl}
                quality={currentQuality}
                onEnded={handleNextEpisode}
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">{episode.title}</h1>
                <p className="text-muted-foreground">
                  {content.title} - {season.title}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevEpisode}
                  disabled={!prevEpisode}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNextEpisode}
                  disabled={!nextEpisode}
                >
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="md:hidden"
                  onClick={() => setShowComments(!showComments)}
                >
                  <MessageSquare className="h-4 w-4" />
                  <span className="ml-2">Comments</span>
                </Button>
              </div>
            </div>

            <div className="mt-6">
              <Tabs defaultValue="quality">
                <TabsList>
                  <TabsTrigger value="quality">Quality</TabsTrigger>
                  <TabsTrigger value="info">Episode Info</TabsTrigger>
                </TabsList>
                <TabsContent value="quality" className="py-4">
                  <div className="flex gap-2">
                    {episode.qualities.map((quality) => (
                      <Button
                        key={quality}
                        variant={quality === currentQuality ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentQuality(quality)}
                      >
                        {quality}
                      </Button>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="info" className="py-4">
                  <p>
                    Duration: {episode.duration}
                  </p>
                  <p className="mt-2">
                    This episode is part of {content.title}, {season.title}.
                  </p>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Episode list and comments - Desktop */}
          <div
            className={`hidden md:block w-full md:w-80 lg:w-96 bg-card rounded-lg border border-border overflow-hidden sticky top-20 h-[calc(100vh-6rem)]`}
          >
            <Tabs defaultValue="episodes">
              <TabsList className="w-full">
                <TabsTrigger value="episodes" className="flex-1">
                  Episodes
                </TabsTrigger>
                <TabsTrigger value="comments" className="flex-1">
                  Comments
                </TabsTrigger>
              </TabsList>
              <TabsContent
                value="episodes"
                className="p-0 overflow-y-auto h-[calc(100%-40px)]"
              >
                <div className="p-4">
                  <h3 className="font-semibold mb-2">{content.title}</h3>
                  {content.seasons.map((s) => (
                    <div key={s.id} className="mb-4">
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">
                        {s.title}
                      </h4>
                      <div className="space-y-1">
                        {s.episodes.map((e) => (
                          <button
                            key={e.id}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                              e.id === episode.id
                                ? "bg-primary/10 text-primary font-medium"
                                : "hover:bg-muted"
                            }`}
                            onClick={() =>
                              router.push(`/stream/${contentId}/${s.id}/${e.id}`)
                            }
                          >
                            {e.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent
                value="comments"
                className="p-0 overflow-y-auto h-[calc(100%-40px)]"
              >
                <CommentsList comments={streamingComments} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Mobile comments overlay */}
          {showComments && (
            <div className="md:hidden fixed inset-0 bg-background/95 z-50 p-4 overflow-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Comments</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowComments(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <CommentsList comments={streamingComments} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}