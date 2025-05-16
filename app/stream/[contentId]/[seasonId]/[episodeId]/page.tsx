import { streamingContent } from "@/lib/mock-data";
import EpisodeClient from "./episode-client";

export async function generateStaticParams() {
  return streamingContent.flatMap((content) =>
    content.seasons.flatMap((season) =>
      season.episodes.map((episode) => ({
        contentId: content.id,
        seasonId: season.id,
        episodeId: episode.id,
      }))
    )
  );
}

export default function EpisodePage({ params }: { params: { contentId: string; seasonId: string; episodeId: string } }) {
  return <EpisodeClient params={params} />;
}