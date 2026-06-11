export interface User {
  id: string
  name: string
  email: string
  password_hash: string
  avatar: string
  role: 'admin' | 'user'
  status: 'active' | 'expired' | 'suspended' | 'blocked'
  expires_at: string | null
  max_sessions: number
  created_at: string
  updated_at: string
}

export interface Permission {
  id: string
  user_id: string
  can_watch_movies: boolean
  can_watch_series: boolean
  can_download: boolean
  can_use_favorites: boolean
  can_use_watchlist: boolean
  vip_access: boolean
}

export interface Favorite {
  id: string
  user_id: string
  media_id: number
  media_type: 'movie' | 'tv'
  created_at: string
}

export interface Watchlist {
  id: string
  user_id: string
  media_id: number
  media_type: 'movie' | 'tv'
  created_at: string
}

export interface WatchHistory {
  id: string
  user_id: string
  media_id: number
  media_type: 'movie' | 'tv'
  watched_time: number
  total_duration: number
  season_number: number | null
  episode_number: number | null
  completed: boolean
  updated_at: string
}

export interface RecentView {
  id: string
  user_id: string
  media_id: number
  viewed_at: string
}

export interface Subscription {
  id: string
  user_id: string
  start_date: string
  expiration_date: string
  status: 'active' | 'expired' | 'cancelled'
}

export interface MediaItem {
  id: number
  title?: string
  name?: string
  poster_path: string | null
  backdrop_path: string | null
  overview: string
  vote_average: number
  release_date?: string
  first_air_date?: string
  genre_ids?: number[]
  media_type: 'movie' | 'tv'
}

export interface MovieDetail {
  id: number
  title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  vote_average: number
  release_date: string
  runtime: number
  genres: { id: number; name: string }[]
  tagline: string
  credits: {
    cast: {
      id: number
      name: string
      character: string
      profile_path: string | null
    }[]
  }
  similar: MediaItem[]
  videos: {
    results: {
      key: string
      site: string
      type: string
    }[]
  }
}

export interface TVDetail {
  id: number
  name: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  vote_average: number
  first_air_date: string
  last_air_date: string
  number_of_seasons: number
  number_of_episodes: number
  genres: { id: number; name: string }[]
  seasons: TVSeason[]
  credits: {
    cast: {
      id: number
      name: string
      character: string
      profile_path: string | null
    }[]
  }
  similar: MediaItem[]
  videos: {
    results: {
      key: string
      site: string
      type: string
    }[]
  }
}

export interface TVSeason {
  id: number
  name: string
  overview: string
  poster_path: string | null
  season_number: number
  episodes: TVEpisode[]
}

export interface TVEpisode {
  id: number
  name: string
  overview: string
  still_path: string | null
  episode_number: number
  season_number: number
  air_date: string
  runtime: number
}

export interface UserStats {
  movies_watched: number
  series_watched: number
  total_hours: number
  favorites_count: number
}

export interface AuthResponse {
  token: string
  user: Omit<User, 'password_hash'>
  permissions: Permission
}
