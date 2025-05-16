"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthButton } from "@/components/auth/auth-button";
import {
  Tv,
  BookOpen,
  Menu,
  X,
  Search,
  TrendingUp,
  Bookmark,
  History,
  User,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          isScrolled
            ? "bg-background/95 backdrop-blur-md border-b border-border"
            : "bg-transparent"
        )}
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
              Baton
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/stream"
              className={cn(
                "flex items-center space-x-2 px-4 py-2 rounded-full transition-colors",
                pathname.startsWith("/stream")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Tv className="w-4 h-4" />
              <span>Stream</span>
            </Link>
            <Link
              href="/comics"
              className={cn(
                "flex items-center space-x-2 px-4 py-2 rounded-full transition-colors",
                pathname.startsWith("/comics")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <BookOpen className="w-4 h-4" />
              <span>Comics</span>
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => setIsSearchOpen(true)}
            >
              <Search className="w-5 h-5" />
            </Button>
            <ThemeToggle />

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <User className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Link href="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href="/bookmarks" className="flex items-center">
                      <Bookmark className="mr-2 h-4 w-4" />
                      Bookmarks
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href="/history" className="flex items-center">
                      <History className="mr-2 h-4 w-4" />
                      History
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <AuthButton />
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-full"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-background/95 backdrop-blur-md border-b border-border">
            <nav className="container mx-auto px-4 py-4 space-y-2">
              <Link
                href="/stream"
                className={cn(
                  "flex items-center space-x-2 p-3 rounded-lg transition-colors",
                  pathname.startsWith("/stream")
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-accent"
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                <Tv className="w-5 h-5" />
                <span>Stream</span>
              </Link>
              <Link
                href="/comics"
                className={cn(
                  "flex items-center space-x-2 p-3 rounded-lg transition-colors",
                  pathname.startsWith("/comics")
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-accent"
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                <BookOpen className="w-5 h-5" />
                <span>Comics</span>
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Full-screen Search */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 search-backdrop">
          <div className="container mx-auto px-4 h-screen pt-32">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">Search</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={() => setIsSearchOpen(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="relative">
                <Input
                  placeholder="Search for titles, genres, or creators..."
                  className="pl-12 h-14 text-lg bg-background/50 backdrop-blur-sm border-primary/20"
                  autoFocus
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              </div>

              <div className="mt-8">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">
                  Quick Links
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="secondary"
                    className="justify-start"
                    onClick={() => setIsSearchOpen(false)}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Trending
                  </Button>
                  <Button
                    variant="secondary"
                    className="justify-start"
                    onClick={() => setIsSearchOpen(false)}
                  >
                    <Bookmark className="w-4 h-4 mr-2" />
                    Bookmarks
                  </Button>
                  <Button
                    variant="secondary"
                    className="justify-start"
                    onClick={() => setIsSearchOpen(false)}
                  >
                    <History className="w-4 h-4 mr-2" />
                    Recently Viewed
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;