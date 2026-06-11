const EMBED = 'https://ezvidapi.com'

export function getMovieEmbedUrl(id: number | string) {
  return `${EMBED}/embed/movie/${id}`
}

export function getTVEmbedUrl(id: number | string) {
  return `${EMBED}/embed/tv/${id}/1/1`
}

export function getEpisodeEmbedUrl(id: number | string, season: number, episode: number) {
  return `${EMBED}/embed/tv/${id}/${season}/${episode}`
}
