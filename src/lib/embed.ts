const CACHE = new Map<string, string>()
const AVAIL_CACHE = new Map<string, boolean>()

export type Provider = 'auto' | 'watchplayer' | 'embedplayer2'

export type Availability = {
  playerflix: boolean
  watchplayer: boolean
}

function buildPfUrl(id: number | string, type: 'movie' | 'tv', season?: number, episode?: number): string {
  if (type === 'movie') return `https://playerflix.ink/pages/ajax.php?id=${id}&type=movie`
  return `https://playerflix.ink/pages/ajax.php?id=${id}&type=tv&season=${season}&episode=${episode}`
}

function buildWpUrl(id: number | string, type: 'movie' | 'tv', season?: number, episode?: number): string {
  if (type === 'movie') return `https://watchplayer.xyz/movie/${id}`
  return `https://watchplayer.xyz/tvshow/${id}/${season}/${episode}`
}

function proxyUrl(domain: 'pf' | 'wp', path: string): string {
  return `/${domain === 'pf' ? 'api/pf' : 'api/wp'}/${path}`
}

function extractEmbed(html: string, prefer?: Provider): string | null {
  let fallback: string | null = null
  const regex = /data-audio="([^"]*)"[^>]*data-embed="([^"]*)"|data-embed="([^"]*)"[^>]*data-audio="([^"]*)"/gi
  let match
  while ((match = regex.exec(html)) !== null) {
    const audio = match[1] || match[4] || ''
    const b64 = match[2] || match[3]
    if (!b64) continue
    try {
      const decoded = atob(b64)
      if (prefer === 'watchplayer' && decoded.includes('watchplayer.xyz')) return decoded
      if (prefer === 'embedplayer2' && decoded.includes('embedplayer2.xyz')) return decoded
      if (!fallback) fallback = decoded
      if (decoded.includes('watchplayer.xyz')) fallback = decoded
      if (audio === 'pt-br' && decoded.includes('embedplayer') && !fallback?.includes('watchplayer')) fallback = decoded
    } catch {}
  }
  return fallback
}

async function fetchPlayerFlixViaProxy(path: string, prefer?: Provider): Promise<string | null> {
  if (CACHE.has(path)) return CACHE.get(path)!
  try {
    const res = await fetch(proxyUrl('pf', path), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://playerflix.ink/',
      },
    })
    if (!res.ok) return null
    const html = await res.text()
    const embed = extractEmbed(html, prefer)
    if (embed) CACHE.set(path, embed)
    return embed
  } catch {
    return null
  }
}

async function hasWatchPlayer(id: number | string, type: 'movie' | 'tv', season?: number, episode?: number, releaseDate?: string): Promise<boolean> {
  if (type === 'movie' && releaseDate && new Date(releaseDate) > new Date()) return false
  const key = `${id}-${type}-${season ?? ''}-${episode ?? ''}`
  if (AVAIL_CACHE.has(key)) return AVAIL_CACHE.get(key)!
  if (type === 'movie') { AVAIL_CACHE.set(key, true); return true }
  try {
    const path = `tvshow/${id}/${season}/${episode}`
    const res = await fetch(proxyUrl('wp', path), {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    })
    const ok = res.ok
    AVAIL_CACHE.set(key, ok)
    return ok
  } catch {
    AVAIL_CACHE.set(key, false)
    return false
  }
}

export async function resolveEmbed(
  id: number | string,
  type: 'movie' | 'tv',
  season?: number,
  episode?: number,
  prefer?: Provider,
  releaseDate?: string
): Promise<{ url: string; available: Availability }> {
  if (prefer === 'embedplayer2') {
    const pfPath = type === 'movie'
      ? `pages/ajax.php?id=${id}&type=movie`
      : `pages/ajax.php?id=${id}&type=tv&season=${season}&episode=${episode}`
    const pf = await fetchPlayerFlixViaProxy(pfPath, 'embedplayer2')
    return { url: pf || buildPfUrl(id, type, season, episode), available: { playerflix: pf !== null, watchplayer: false } }
  }

  if (prefer === 'watchplayer') {
    return { url: buildWpUrl(id, type, season, episode), available: { playerflix: false, watchplayer: true } }
  }

  const wpOk = await hasWatchPlayer(id, type, season, episode, releaseDate)
  if (wpOk) {
    return { url: buildWpUrl(id, type, season, episode), available: { playerflix: false, watchplayer: true } }
  }

  const pfPath = type === 'movie'
    ? `pages/ajax.php?id=${id}&type=movie`
    : `pages/ajax.php?id=${id}&type=tv&season=${season}&episode=${episode}`
  const pf = await fetchPlayerFlixViaProxy(pfPath, prefer)
  return { url: pf || buildPfUrl(id, type, season, episode), available: { playerflix: pf !== null, watchplayer: false } }
}

export async function getMovieEmbedUrl(id: number | string, provider?: Provider): Promise<string> {
  return (await resolveEmbed(id, 'movie', undefined, undefined, provider)).url
}

export async function getEpisodeEmbedUrl(id: number | string, season: number, episode: number, provider?: Provider): Promise<string> {
  return (await resolveEmbed(id, 'tv', season, episode, provider)).url
}
