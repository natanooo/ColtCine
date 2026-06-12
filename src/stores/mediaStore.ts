import { create } from 'zustand'
import { turso } from '@/lib/turso'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import type { MovieDetail, TVDetail, TVEpisode, MediaItem } from '@/types'

function emptyMovie(id: number): MovieDetail {
  return { id, title: 'Filme indisponível', overview: '', poster_path: null, backdrop_path: null, vote_average: 0, release_date: '', runtime: 0, tagline: '', genres: [], credits: { cast: [] }, similar: [], videos: { results: [] } }
}

function emptyTV(id: number): TVDetail {
  return { id, name: 'Série indisponível', overview: '', poster_path: null, backdrop_path: null, vote_average: 0, first_air_date: '', last_air_date: '', number_of_seasons: 0, number_of_episodes: 0, genres: [], seasons: [], credits: { cast: [] }, similar: [], videos: { results: [] } }
}

async function fetchMovieFromTMDB(id: number): Promise<MovieDetail | null> {
  const data = await api.get<any>(`/movie/${id}`, { language: 'pt-BR', append_to_response: 'credits,similar,videos' })
  if (!data) return null
  return {
    id: data.id, title: data.title, overview: data.overview,
    poster_path: data.poster_path, backdrop_path: data.backdrop_path,
    vote_average: data.vote_average, release_date: data.release_date,
    runtime: data.runtime || 0, tagline: data.tagline || '',
    genres: data.genres || [],
    credits: data.credits ? { cast: data.credits.cast?.slice(0, 10) || [] } : { cast: [] },
    similar: (data.similar?.results || []).slice(0, 10).map((r: any) => ({ ...r, media_type: 'movie' as const })),
    videos: data.videos || { results: [] },
  }
}

async function fetchTVFromTMDB(id: number): Promise<TVDetail | null> {
  const data = await api.get<any>(`/tv/${id}`, { language: 'pt-BR', append_to_response: 'credits,similar' })
  if (!data) return null
  let seasons: TVDetail['seasons'] = []
  if (data.seasons?.length) {
    seasons = await Promise.all(
      data.seasons.filter((s: any) => s.season_number > 0).map(async (s: any) => {
        const eps = await api.get<{ episodes: TVEpisode[] }>(`/tv/${id}/season/${s.season_number}`, { language: 'pt-BR' })
        return { ...s, episodes: eps?.episodes || [] }
      })
    )
  }
  return {
    id: data.id, name: data.name, overview: data.overview,
    poster_path: data.poster_path, backdrop_path: data.backdrop_path,
    vote_average: data.vote_average, first_air_date: data.first_air_date,
    last_air_date: data.last_air_date,
    number_of_seasons: data.number_of_seasons || 0,
    number_of_episodes: data.number_of_episodes || 0,
    genres: data.genres || [],
    seasons,
    credits: data.credits ? { cast: data.credits.cast?.slice(0, 10) || [] } : { cast: [] },
    similar: (data.similar?.results || []).slice(0, 10).map((r: any) => ({ ...r, media_type: 'tv' as const })),
    videos: { results: [] },
  }
}

interface MediaState {
  movies: MediaItem[]
  series: MediaItem[]
  trending: MediaItem[]
  popularMovies: MediaItem[]
  popularTV: MediaItem[]
  featured: MediaItem | null
  fetchHomeData: () => Promise<void>
  getMovieDetails: (id: number) => Promise<MovieDetail>
  getTVDetails: (id: number) => Promise<TVDetail>
  search: (q: string) => Promise<MediaItem[]>
  getMediaById: (id: number, type: 'movie' | 'tv') => Promise<MediaItem | null>
  favorites: any[]
  watchlist: any[]
  fetchFavorites: () => Promise<void>
  fetchWatchlist: () => Promise<void>
  addFavorite: (mediaId: number, mediaType: 'movie' | 'tv') => Promise<void>
  removeFavorite: (mediaId: number, mediaType: 'movie' | 'tv') => Promise<void>
  addToWatchlist: (mediaId: number, mediaType: 'movie' | 'tv') => Promise<void>
  removeFromWatchlist: (mediaId: number, mediaType: 'movie' | 'tv') => Promise<void>
  isFavorite: (mediaId: number, mediaType: 'movie' | 'tv') => Promise<boolean>
  isInWatchlist: (mediaId: number, mediaType: 'movie' | 'tv') => Promise<boolean>
  saveWatchProgress: (mediaId: number, mediaType: 'movie' | 'tv', watchedTime: number, totalDuration: number, seasonNumber?: number, episodeNumber?: number) => Promise<void>
  addRecentView: (mediaId: number, mediaType: 'movie' | 'tv', seasonNumber?: number, episodeNumber?: number) => Promise<void>
  getContinueWatching: () => Promise<any[]>
}

export const useMediaStore = create<MediaState>((set, get) => ({
  movies: [],
  series: [],
  trending: [],
  popularMovies: [],
  popularTV: [],
  featured: null,
  favorites: [],
  watchlist: [],

  fetchHomeData: async () => {
    const tr = await api.get<{ results: MediaItem[] }>('/trending/all/week', { language: 'pt-BR' })
    if (tr?.results?.length) {
      const items = tr.results.map(r => ({ ...r, media_type: (r.media_type || 'movie') as 'movie' | 'tv' }))
      set({ trending: items.slice(0, 20), featured: items[0] })
    }
    const mp = await api.get<{ results: MediaItem[] }>('/movie/popular', { language: 'pt-BR' })
    if (mp?.results?.length) set({ popularMovies: mp.results.map(r => ({ ...r, media_type: 'movie' as const })).slice(0, 20) })
    const tv = await api.get<{ results: MediaItem[] }>('/tv/popular', { language: 'pt-BR' })
    if (tv?.results?.length) set({ popularTV: tv.results.map(r => ({ ...r, media_type: 'tv' as const })).slice(0, 20) })
  },

  getMovieDetails: async (id) => {
    const fromTMDB = await fetchMovieFromTMDB(id)
    return fromTMDB || emptyMovie(id)
  },

  getTVDetails: async (id) => {
    const fromTMDB = await fetchTVFromTMDB(id)
    return fromTMDB || emptyTV(id)
  },

  search: async (q) => {
    const data = await api.get<{ results: MediaItem[] }>('/search/multi', { query: q, language: 'pt-BR' })
    if (data?.results?.length) return data.results.filter(r => r.media_type === 'movie' || r.media_type === 'tv').slice(0, 20)
    return []
  },

  getMediaById: async (id, type) => {
    if (type === 'movie') {
      const d = await fetchMovieFromTMDB(id)
      if (!d) return null
      return { id: d.id, title: d.title, poster_path: d.poster_path, backdrop_path: d.backdrop_path, overview: d.overview, vote_average: d.vote_average, release_date: d.release_date, media_type: 'movie' } as MediaItem
    }
    const d = await fetchTVFromTMDB(id)
    if (!d) return null
    return { id: d.id, name: d.name, poster_path: d.poster_path, backdrop_path: d.backdrop_path, overview: d.overview, vote_average: d.vote_average, first_air_date: d.first_air_date, media_type: 'tv' } as MediaItem
  },

  fetchFavorites: async () => {
    const user = useAuthStore.getState().user; if (!user) return
    const rs = await turso.execute({ sql: 'SELECT * FROM favorites WHERE user_id = ? ORDER BY created_at DESC', args: [user.id] })
    set({ favorites: rs.rows })
  },

  fetchWatchlist: async () => {
    const user = useAuthStore.getState().user; if (!user) return
    const rs = await turso.execute({ sql: 'SELECT * FROM watchlist WHERE user_id = ? ORDER BY created_at DESC', args: [user.id] })
    set({ watchlist: rs.rows })
  },

  addFavorite: async (mediaId, mediaType) => {
    const user = useAuthStore.getState().user; if (!user) return
    await turso.execute({ sql: 'INSERT OR IGNORE INTO favorites (user_id, media_id, media_type) VALUES (?, ?, ?)', args: [user.id, mediaId, mediaType] })
    await get().fetchFavorites()
  },

  removeFavorite: async (mediaId, mediaType) => {
    const user = useAuthStore.getState().user; if (!user) return
    await turso.execute({ sql: 'DELETE FROM favorites WHERE user_id = ? AND media_id = ? AND media_type = ?', args: [user.id, mediaId, mediaType] })
    await get().fetchFavorites()
  },

  addToWatchlist: async (mediaId, mediaType) => {
    const user = useAuthStore.getState().user; if (!user) return
    await turso.execute({ sql: 'INSERT OR IGNORE INTO watchlist (user_id, media_id, media_type) VALUES (?, ?, ?)', args: [user.id, mediaId, mediaType] })
    await get().fetchWatchlist()
  },

  removeFromWatchlist: async (mediaId, mediaType) => {
    const user = useAuthStore.getState().user; if (!user) return
    await turso.execute({ sql: 'DELETE FROM watchlist WHERE user_id = ? AND media_id = ? AND media_type = ?', args: [user.id, mediaId, mediaType] })
    await get().fetchWatchlist()
  },

  isFavorite: async (mediaId, mediaType) => {
    const user = useAuthStore.getState().user; if (!user) return false
    const rs = await turso.execute({ sql: 'SELECT 1 FROM favorites WHERE user_id = ? AND media_id = ? AND media_type = ?', args: [user.id, mediaId, mediaType] })
    return rs.rows.length > 0
  },

  isInWatchlist: async (mediaId, mediaType) => {
    const user = useAuthStore.getState().user; if (!user) return false
    const rs = await turso.execute({ sql: 'SELECT 1 FROM watchlist WHERE user_id = ? AND media_id = ? AND media_type = ?', args: [user.id, mediaId, mediaType] })
    return rs.rows.length > 0
  },

  saveWatchProgress: async (mediaId, mediaType, watchedTime, totalDuration, seasonNumber, episodeNumber) => {
    const user = useAuthStore.getState().user; if (!user) return
    const sn = seasonNumber ?? 0
    const en = episodeNumber ?? 0
    const completed = totalDuration > 0 && watchedTime > 0 && watchedTime >= totalDuration ? 1 : 0
    await turso.execute({
      sql: `INSERT INTO watch_history (user_id, media_id, media_type, watched_time, total_duration, season_number, episode_number, completed) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, media_id, media_type, season_number, episode_number) DO UPDATE SET
        watched_time = excluded.watched_time, total_duration = excluded.total_duration, completed = excluded.completed, updated_at = datetime('now')`,
      args: [user.id, mediaId, mediaType, watchedTime, totalDuration, sn, en, completed],
    })
  },

  addRecentView: async (mediaId, mediaType, seasonNumber, episodeNumber) => {
    const user = useAuthStore.getState().user; if (!user) return
    const sn = seasonNumber ?? null
    const en = episodeNumber ?? null
    await turso.execute({
      sql: `DELETE FROM recent_views WHERE user_id = ? AND media_id = ? AND media_type = ? AND COALESCE(season_number, -1) = COALESCE(?, -1) AND COALESCE(episode_number, -1) = COALESCE(?, -1)`,
      args: [user.id, mediaId, mediaType, sn, en],
    })
    await turso.execute({
      sql: `INSERT INTO recent_views (user_id, media_id, media_type, season_number, episode_number, viewed_at) VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      args: [user.id, mediaId, mediaType, sn, en],
    })
  },

  getContinueWatching: async () => {
    const user = useAuthStore.getState().user; if (!user) return []
    const rs = await turso.execute({
      sql: `SELECT wh.* FROM watch_history wh
        INNER JOIN (SELECT MAX(rowid) as max_id FROM watch_history WHERE user_id = ? AND completed = 0 GROUP BY media_id, media_type, season_number, episode_number) latest
        ON wh.rowid = latest.max_id
        ORDER BY wh.updated_at DESC LIMIT 20`,
      args: [user.id],
    })
    return rs.rows
  },
}))
