"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { MangaCardImage } from "@/components/manga-card-image";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"; // TabsContent tidak digunakan langsung
import { Filter,ChevronLeft, ChevronRight } from "lucide-react";

// Interface dari page.tsx
interface MangaFromDB {
  id: string;
  title: string;
  source_url: string;
  cover_image_url?: string;
  author?: string;
  description?: string;
  type?: string;
  genres?: { name: string }[];
}

interface ComicsPageClientContentProps {
  initialMangas: MangaFromDB[];
  uniqueTypes: string[];
  uniqueGenres: string[];
}

const ITEMS_PER_PAGE = 20; // Definisikan jumlah item per halaman

export function ComicsPageClientContent({ 
  initialMangas, 
  uniqueTypes, 
  uniqueGenres 
}: ComicsPageClientContentProps) {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("");
  const [selectedGenreFilter, setSelectedGenreFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);

  const filteredMangas = useMemo(() => {
    let mangas = [...initialMangas];
    if (activeTab !== "all") {
      mangas = mangas.filter(manga => manga.type?.toLowerCase() === activeTab.toLowerCase());
    }
    if (activeTab === "all" && selectedTypeFilter) {
      mangas = mangas.filter(manga => manga.type === selectedTypeFilter);
    }
    if (selectedGenreFilter) {
      mangas = mangas.filter(manga => 
        manga.genres?.some(genre => genre.name === selectedGenreFilter)
      );
    }
    // Reset halaman ke 1 setiap kali filter berubah
    // Ini akan dijalankan setelah memo filteredMangas, jadi perlu cara lain
    // Untuk sementara, pengguna mungkin perlu klik prev/next atau refresh filter utk reset halaman
    return mangas;
  }, [initialMangas, activeTab, selectedTypeFilter, selectedGenreFilter]);

  // Efek untuk mereset halaman ke 1 ketika filter berubah
  useMemo(() => {
    setCurrentPage(1);
  }, [activeTab, selectedTypeFilter, selectedGenreFilter]);

  const paginatedMangas = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredMangas.slice(startIndex, endIndex);
  }, [filteredMangas, currentPage]);

  const totalPages = Math.ceil(filteredMangas.length / ITEMS_PER_PAGE);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <>
      <div className="mb-8"> {/* Wrapper untuk Filters dan Tabs */}
        {/* Filters */}
        <div className="flex gap-2 flex-wrap mb-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Type: {selectedTypeFilter || "All"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => setSelectedTypeFilter("")}>All Types</DropdownMenuItem>
              {uniqueTypes.map((type) => (
                <DropdownMenuItem key={type} onSelect={() => setSelectedTypeFilter(type)}>
                  {type}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Genre: {selectedGenreFilter || "All"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-h-72 overflow-y-auto">
              <DropdownMenuItem onSelect={() => setSelectedGenreFilter("")}>All Genres</DropdownMenuItem>
              {uniqueGenres.map((genre) => (
                <DropdownMenuItem key={genre} onSelect={() => setSelectedGenreFilter(genre)}>
                  {genre}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-1 rounded-full">
            <TabsTrigger value="all" className="rounded-full">All Comics</TabsTrigger>
            <TabsTrigger value="manga" className="rounded-full">Manga</TabsTrigger>
            <TabsTrigger value="manhwa" className="rounded-full">Manhwa</TabsTrigger>
            <TabsTrigger value="manhua" className="rounded-full">Manhua</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Grid Manga */}
      {paginatedMangas.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {paginatedMangas.map((manga, index) => (
              <Link 
                href={`/comics/${manga.id}`} 
                key={manga.id || manga.source_url || index} 
                className="bg-card border border-border rounded-lg p-4 shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col focus:outline-none focus:ring-2 focus:ring-primary"
              >
                  {manga.cover_image_url && (
                    <div className="relative w-full h-72 mb-3 rounded overflow-hidden">
                      <MangaCardImage 
                        src={manga.cover_image_url}
                        alt={`Cover for ${manga.title}`}
                        title={manga.title}
                      />
                    </div>
                  )}
                  <h2 
                    className="text-lg font-semibold truncate text-card-foreground mb-1" 
                    title={manga.title}
                  >
                    {manga.title || 'N/A'}
                  </h2>
                  {manga.type && (
                    <span className="inline-block text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full mb-2">
                      {manga.type}
                    </span>
                  )}
                  {manga.author && (
                    <p className="text-xs text-muted-foreground mb-1">
                      Author: {Array.isArray(manga.author) ? manga.author.join(', ') : manga.author}
                    </p>
                  )}
                   {manga.genres && manga.genres.length > 0 && (
                    <div className="mt-auto pt-2">
                      <p className="text-xs text-muted-foreground mb-1">Genres:</p>
                      <div className="flex flex-wrap gap-1">
                        {manga.genres.map((genre) => (
                          <span 
                            key={genre.name} 
                            className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full"
                          >
                            {genre.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
              </Link>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center items-center gap-4">
              <Button 
                variant="outline" 
                onClick={handlePreviousPage} 
                disabled={currentPage === 1}
                className="gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button 
                variant="outline" 
                onClick={handleNextPage} 
                disabled={currentPage === totalPages}
                className="gap-1"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-10">
          <p className="text-xl text-muted-foreground">No comics match your current filters.</p>
        </div>
      )}
    </>
  );
} 