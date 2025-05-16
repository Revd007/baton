import useSWR from 'swr';
import { AnimeInfo } from './scrapers/anime';
import { MangaInfo } from './scrapers/manga';

const BASE_URL = '/api';

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch data');
  }
  return response.json();
};

export function useHomeAnime() {
  return useSWR(`${BASE_URL}/home`, fetcher);
}

export function useAnimeList() {
  return useSWR(`${BASE_URL}/anime-list`, fetcher);
}

export function useAnimeDetails(slug: string) {
  return useSWR(slug ? `${BASE_URL}/anime/${slug}` : null, fetcher);
}

export function useEpisodeDetails(eps: string) {
  return useSWR(eps ? `${BASE_URL}/anime/episode/${eps}` : null, fetcher);
}

export function useAnimeBatch(slug: string) {
  return useSWR(slug ? `${BASE_URL}/anime/batch/${slug}` : null, fetcher);
}

export function useAnimeSearch(query: string) {
  return useSWR(
    query ? `${BASE_URL}/anime/search?q=${encodeURIComponent(query)}` : null,
    fetcher
  );
}

export function useReleaseSchedule() {
  return useSWR(`${BASE_URL}/release-schedule`, fetcher);
}

export function useGenreList() {
  return useSWR(`${BASE_URL}/genre-list`, fetcher);
}

export function useOngoingAnime() {
  return useSWR(`${BASE_URL}/ongoing-anime`, fetcher);
}

export function useCompleteAnime() {
  return useSWR(`${BASE_URL}/complete-anime`, fetcher);
}

export function useScrapedAnime() {
  return useSWR<AnimeInfo[]>(`${BASE_URL}/scrape/anime`, fetcher);
}

export function useScrapedManga() {
  return useSWR<MangaInfo[]>(`${BASE_URL}/scrape/manga`, fetcher);
}