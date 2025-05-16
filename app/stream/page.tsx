import Link from "next/link";
import Image from "next/image";
import { streamingContent, contentTypes, genres } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Play, TrendingUp, Clock, Star, Filter } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const metadata = {
  title: "Stream Videos - Baton",
  description: "Watch your favorite videos with quality selection and fullscreen support",
};

export default function StreamPage() {
  return (
    <div className="pt-20 pb-16 min-h-screen">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-start gap-8 mb-12">
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
              Stream Videos
            </h1>
            <p className="text-lg text-muted-foreground">
              Discover and watch amazing content with our premium streaming experience
            </p>
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="w-4 h-4" />
                  Type
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {Object.entries(contentTypes.video).map(([key, value]) => (
                  <DropdownMenuItem key={key}>{value}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="w-4 h-4" />
                  Genre
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {Object.entries(genres).map(([key, value]) => (
                  <DropdownMenuItem key={key}>{value}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-1 rounded-full">
            <TabsTrigger value="all" className="rounded-full">All</TabsTrigger>
            <TabsTrigger value="anime" className="rounded-full">Anime</TabsTrigger>
            <TabsTrigger value="movies" className="rounded-full">Movies</TabsTrigger>
            <TabsTrigger value="series" className="rounded-full">TV Series</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-8">
            {streamingContent.map((content) => (
              <section key={content.id} className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{content.title}</h2>
                    <div className="flex gap-2 mt-2">
                      <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded-full">
                        {contentTypes.video[content.type as keyof typeof contentTypes.video]}
                      </span>
                      {content.genres.map((genre) => (
                        <span
                          key={genre}
                          className="text-sm bg-secondary/10 text-secondary-foreground px-2 py-1 rounded-full"
                        >
                          {genres[genre as keyof typeof genres]}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Link 
                    href={`/stream/${content.id}`} 
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    View All
                  </Link>
                </div>
                <p className="text-muted-foreground">{content.description}</p>
                
                {content.seasons.map((season) => (
                  <div key={season.id} className="space-y-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      {season.title}
                      <span className="text-sm text-muted-foreground">
                        ({season.episodes.length} episodes)
                      </span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {season.episodes.map((episode) => (
                        <Link 
                          href={`/stream/${content.id}/${season.id}/${episode.id}`} 
                          key={episode.id}
                        >
                          <Card className="overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl bg-card/50 backdrop-blur-sm">
                            <div className="relative aspect-video">
                              <Image 
                                src={episode.thumbnail}
                                alt={episode.title}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center">
                                  <Play className="w-6 h-6 text-white" />
                                </div>
                              </div>
                            </div>
                            <CardContent className="p-4">
                              <h4 className="font-medium truncate mb-1">{episode.title}</h4>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {episode.duration}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            ))}
          </TabsContent>

          {/* Similar structure for other tabs */}
        </Tabs>
      </div>
    </div>
  );
}