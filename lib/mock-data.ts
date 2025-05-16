// Content types and genres
export const contentTypes = {
  video: {
    anime: "Anime",
    movie: "Movies",
    series: "TV Series",
    documentary: "Documentaries"
  },
  comic: {
    manga: "Manga",
    manhwa: "Manhwa",
    manhua: "Manhua",
    webtoon: "Webtoon"
  }
};

export const genres = {
  action: "Action",
  adventure: "Adventure",
  comedy: "Comedy",
  drama: "Drama",
  fantasy: "Fantasy",
  horror: "Horror",
  mystery: "Mystery",
  romance: "Romance",
  scifi: "Sci-Fi",
  slice: "Slice of Life",
  sports: "Sports",
  supernatural: "Supernatural"
};

// Mock data for streaming content
export const streamingContent = [
  {
    id: "anime-1",
    title: "Dragon Chronicles",
    type: "anime",
    genres: ["action", "fantasy", "adventure"],
    description: "Follow the adventures of legendary dragons in a fantasy world.",
    thumbnail: "https://images.pexels.com/photos/3573351/pexels-photo-3573351.png",
    rating: "PG-13",
    releaseYear: 2024,
    studio: "Anime Studio X",
    seasons: [
      {
        id: "s1",
        title: "Season 1",
        episodes: [
          {
            id: "s1e1",
            title: "Episode 1: The Beginning",
            duration: "24:15",
            thumbnail: "https://images.pexels.com/photos/3573351/pexels-photo-3573351.png",
            videoUrl: "https://samplelib.com/lib/preview/mp4/sample-5s.mp4",
            qualities: ["480p", "720p", "1080p"],
            synopsis: "A young dragon rider discovers their destiny."
          },
          // ... other episodes
        ]
      }
      // ... other seasons
    ]
  },
  // ... other content
];

// Mock data for comics
export const comicsContent = [
  {
    id: "comic-1",
    title: "The Defenders",
    type: "manga",
    genres: ["action", "supernatural", "mystery"],
    author: "Jane Smith",
    artist: "John Doe",
    status: "Ongoing",
    releaseYear: 2024,
    publisher: "Manga Plus",
    description: "A group of unlikely heroes must band together to save their city.",
    cover: "https://images.pexels.com/photos/4862890/pexels-photo-4862890.jpeg",
    rating: "Teen",
    chapters: [
      {
        id: "c1",
        title: "Chapter 1: Origins",
        releaseDate: "2024-03-20",
        pages: [
          {
            id: "c1p1",
            imageUrl: "https://images.pexels.com/photos/5054953/pexels-photo-5054953.jpeg"
          },
          // ... other pages
        ]
      }
      // ... other chapters
    ]
  },
  // ... other comics
];

// Comments mock data
export const streamingComments = [
  {
    id: "comment-1",
    username: "dragon_fan22",
    message: "This episode was amazing!",
    timestamp: "12:15",
    likes: 42,
    replies: []
  },
  // ... other comments
];