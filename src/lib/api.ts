const API_URL = 'https://api.themoviedb.org/3'
const KEY = import.meta.env.VITE_TMDB_KEY
const TOKEN = import.meta.env.VITE_TMDB_TOKEN

function hasKey() {
  return TOKEN && TOKEN !== 'your_api_token_here'
}

async function fetchAPI<T>(endpoint: string, params: Record<string, string> = {}): Promise<T | null> {
  if (!hasKey()) return null
  try {
    const url = new URL(`${API_URL}${endpoint}`)
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    url.searchParams.set('api_key', KEY || TOKEN)
    const res = await fetch(url.toString(), {
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export const api = {
  get<T>(endpoint: string, params?: Record<string, string>) {
    return fetchAPI<T>(endpoint, params)
  },

  // Buscar por ID do IMDb
  findByImdb<T>(imdbId: string) {
    return fetchAPI<T>(`/find/${imdbId}`, { external_source: 'imdb_id' })
  },
}
