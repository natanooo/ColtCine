/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MOVIE_API_URL: string
  readonly VITE_MOVIE_API_KEY: string
  readonly VITE_MOVIE_API_TOKEN: string
  readonly VITE_TURSO_URL: string
  readonly VITE_TURSO_TOKEN: string
  readonly VITE_JWT_SECRET: string
  readonly VITE_EMBED_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
