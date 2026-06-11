const EMBED = 'https://cdn-embed.com'

export function getMovieEmbedUrl(id: number | string) {
  return `${EMBED}/filme/${id}`
}

export function getTVEmbedUrl(id: number | string) {
  return `${EMBED}/serie/${id}`
}

export function getEpisodeEmbedUrl(id: number | string, season: number, episode: number) {
  return `${EMBED}/serie/${id}/${season}/${episode}`
}
