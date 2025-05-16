import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tv, BookOpen, Search, TrendingUp, Star } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 hero-gradient"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
            Welcome to Baton
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Your premium destination for streaming and comics. Experience entertainment like never before.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <Input 
                placeholder="Search for titles, genres, or creators..."
                className="pl-12 h-14 text-lg bg-background/50 backdrop-blur-sm border-primary/20"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="w-full sm:w-auto text-lg h-14">
              <Link href="/stream">
                <Tv className="w-5 h-5 mr-2" />
                Start Streaming
              </Link>
            </Button>
            <Button
              asChild
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto text-lg h-14"
            >
              <Link href="/comics">
                <BookOpen className="w-5 h-5 mr-2" />
                Read Comics
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-background/50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold mb-16 text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
            Experience the Difference
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-card rounded-2xl p-8 hover-card-animation">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Premium Streaming</h3>
              <p className="text-muted-foreground">
                Enjoy high-quality video streaming with multiple quality options and
                seamless playback controls.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-8 hover-card-animation">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mb-6">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Immersive Comics</h3>
              <p className="text-muted-foreground">
                Read your favorite comics with our smooth scrolling experience and
                automatic chapter progression.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-8 hover-card-animation">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mb-6">
                <Star className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Personalized For You</h3>
              <p className="text-muted-foreground">
                Discover new content based on your preferences and get
                recommendations tailored just for you.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}