import Link from "next/link";
import Image from "next/image";
import { comicsContent, contentTypes, genres } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, TrendingUp, Star, History, Filter } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const metadata = {
  title: "Read Comics - Baton",
  description: "Read your favorite comics with a seamless scrolling experience",
};

export default function ComicsPage() {
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
                {Object.entries(contentTypes.comic).map(([key, value]) => (
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
            <TabsTrigger value="all" className="rounded-full">All Comics</TabsTrigger>
            <TabsTrigger value="manga" className="rounded-full">Manga</TabsTrigger>
            <TabsTrigger value="manhwa" className="rounded-full">Manhwa</TabsTrigger>
            <TabsTrigger value="manhua" className="rounded-full">Manhua</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {comicsContent.map((comic) => (
                <Link href={`/comics/${comic.id}/${comic.chapters[0].id}`} key={comic.id}>
                  <Card className="overflow-hidden h-full transition-all duration-300 hover:scale-[1.02] hover:shadow-xl bg-card/50 backdrop-blur-sm">
                    <div className="relative aspect-[2/3]">
                      <Image 
                        src={comic.cover}
                        alt={comic.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h2 className="font-bold text-lg mb-1">{comic.title}</h2>
                      <div className="flex gap-2 mb-2">
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                          {contentTypes.comic[comic.type as keyof typeof contentTypes.comic]}
                        </span>
                        {comic.genres.slice(0, 2).map((genre) => (
                          <span
                            key={genre}
                            className="text-xs bg-secondary/10 text-secondary-foreground px-2 py-1 rounded-full"
                          >
                            {genres[genre as keyof typeof genres]}
                          </span>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">by {comic.author}</p>
                      <p className="text-sm line-clamp-2 mb-2">{comic.description}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-primary">{comic.chapters.length} chapters</span>
                        <span className="text-muted-foreground">{comic.status}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </TabsContent>

          {/* Similar structure for other tabs */}
        </Tabs>
      </div>
    </div>
  );
}