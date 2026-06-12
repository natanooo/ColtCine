import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useMediaStore } from '@/stores/mediaStore'
import { resolveEmbed } from '@/lib/embed'
import { getStoredProvider, setStoredProvider } from '@/lib/provider'
import { ArrowBackIcon } from '@/components/shared/Icons'
import type { Provider } from '@/lib/embed'
import type { TVDetail } from '@/types'

const PROVIDERS: { value: Provider; label: string }[] = [
  { value: 'auto', label: 'Automático (WatchPlayer 1º)' },
  { value: 'watchplayer', label: 'WatchPlayer' },
  { value: 'embedplayer2', label: 'PlayerFlix' },
]

export function WatchPage() {
  const { type, id } = useParams<{ type: string; id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const store = useMediaStore()
  const numId = Number(id) || 0
  const isMovie = type === 'movie'
  const initSeason = Number(searchParams.get('s')) || 1
  const initEpisode = Number(searchParams.get('e')) || 1

  const [mediaTitle, setMediaTitle] = useState('')
  const [currentSeason, setCurrentSeason] = useState(initSeason)
  const [currentEpisode, setCurrentEpisode] = useState(initEpisode)
  const [embedUrl, setEmbedUrl] = useState<string | null>(null)
  const [provider, setProvider] = useState<Provider>('auto')
  const [showPicker, setShowPicker] = useState(false)
  const [loading, setLoading] = useState(true)
  const [noProvider, setNoProvider] = useState(false)
  const [tv, setTV] = useState<TVDetail | null>(null)

  const pageStartRef = useRef(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const durRef = useRef(0)
  const storeRef = useRef(store)
  storeRef.current = store

  const resolve = useCallback(async (pref: Provider, releaseDate?: string) => {
    setLoading(true)
    setNoProvider(false)
    setProvider(pref)

    const { url, available } = await resolveEmbed(
      id || '0',
      isMovie ? 'movie' : 'tv',
      isMovie ? undefined : currentSeason,
      isMovie ? undefined : currentEpisode,
      pref,
      releaseDate
    )

    if (!available.playerflix && !available.watchplayer) {
      setNoProvider(true)
      setEmbedUrl(null)
    } else {
      setEmbedUrl(url)
    }
    setLoading(false)
  }, [id, isMovie, currentSeason, currentEpisode])

  useEffect(() => {
    const init = async () => {
      const pref = getStoredProvider()
      if (isMovie) {
        const movie = await store.getMovieDetails(numId)
        setMediaTitle((movie as any).title || `Mídia #${id}`)
        durRef.current = ((movie as any).runtime || 0) * 60
        resolve(pref, (movie as any).release_date)
      } else {
        store.getTVDetails(numId).then(data => {
          setTV(data)
          setMediaTitle((data as any).name || `Mídia #${id}`)
          durRef.current = 0
        })
        resolve(pref)
      }
    }
    init()
  }, [id, type, currentSeason, currentEpisode])

  const epKey = `${numId}-${isMovie ? 'movie' : 'tv'}-${isMovie ? 0 : currentSeason}-${isMovie ? 0 : currentEpisode}`

  useEffect(() => {
    if (!id || !type || !embedUrl) return
    clearInterval(intervalRef.current)
    const s = storeRef.current
    const mid = numId
    const movie = isMovie
    const sn = currentSeason
    const en = currentEpisode
    pageStartRef.current = Date.now()
    s.addRecentView(mid, movie ? 'movie' : 'tv', movie ? 0 : sn, movie ? 0 : en)

    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - pageStartRef.current) / 1000)
      s.saveWatchProgress(mid, movie ? 'movie' : 'tv', elapsed, durRef.current, movie ? 0 : sn, movie ? 0 : en)
    }, 30000)

    return () => {
      clearInterval(intervalRef.current)
      const elapsed = Math.floor((Date.now() - pageStartRef.current) / 1000)
      s.saveWatchProgress(mid, movie ? 'movie' : 'tv', elapsed, durRef.current, movie ? 0 : sn, movie ? 0 : en)
    }
  }, [epKey, embedUrl])

  const handleSelectProvider = useCallback((p: Provider) => {
    setStoredProvider(p)
    setShowPicker(false)
    resolve(p)
  }, [resolve])

  const handleEpisodeSelect = useCallback((s: number, e: number) => {
    setCurrentSeason(s)
    setCurrentEpisode(e)
    pageStartRef.current = Date.now()
  }, [])

  const filteredSeasons = tv?.seasons?.filter(s => s.season_number > 0) || []
  const currentSeasonData = tv?.seasons?.find(s => s.season_number === currentSeason)
  const episodes = currentSeasonData?.episodes || []

  return (
    <div className="min-h-screen bg-black">
      <div className="bg-black">
        <div className="aspect-video max-h-[85vh] mx-auto relative bg-black">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          ) : noProvider ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-[#999] text-sm">Nenhum provider disponível para este conteúdo.</p>
            </div>
          ) : embedUrl ? (
            <iframe src={embedUrl} className="absolute inset-0 w-full h-full" allowFullScreen loading="lazy" allow="autoplay; fullscreen" />
          ) : null}
        </div>

        <div className="flex items-center justify-between px-8 py-4 bg-[#0a0a0a] border-t border-[rgba(255,255,255,.05)]">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="text-white/60 hover:text-white bg-transparent border-none cursor-pointer text-sm transition-colors flex items-center gap-1"><ArrowBackIcon size={16} /> Voltar</button>
            <span className="text-white text-sm font-medium">{mediaTitle}</span>
            {!isMovie && <span className="text-[#777] text-xs">T{currentSeason} • E{currentEpisode}</span>}
          </div>
          <button onClick={() => setShowPicker(true)} className="text-white/80 hover:text-white bg-[#222] border-none cursor-pointer text-xs px-3 py-1.5 rounded-full transition-colors">
            Trocar
          </button>
        </div>
      </div>

      {!isMovie && episodes.length > 0 && (
        <div className="w-[1400px] max-w-[95%] mx-auto py-8">
          {filteredSeasons.length > 0 && (
            <div className="flex gap-3 flex-wrap mb-8">
              {filteredSeasons.map(s => (
                <button
                  key={s.id}
                  onClick={() => setCurrentSeason(s.season_number)}
                  className={`px-5 py-3 rounded-full text-sm border-none cursor-pointer transition-all ${
                    currentSeason === s.season_number
                      ? 'bg-white text-black'
                      : 'bg-[#1c1c1c] text-white hover:bg-[#2a2a2a]'
                  }`}
                >
                  {s.name || `Temporada ${s.season_number}`}
                </button>
              ))}
            </div>
          )}
          <div className="flex flex-col gap-4">
            {episodes.map(ep => {
              const stillUrl = ep.still_path ? `https://image.tmdb.org/t/p/w300${ep.still_path}` : null
              return (
                <button
                  key={ep.id}
                  onClick={() => handleEpisodeSelect(currentSeason, ep.episode_number)}
                  className={`flex gap-4 rounded-[18px] overflow-hidden text-left w-full border-2 transition-colors ${
                    currentEpisode === ep.episode_number
                      ? 'bg-[#1a1a1a] border-[#e50914]'
                      : 'bg-[#111] border-transparent hover:bg-[#1a1a1a]'
                  } max-md:flex-col`}
                >
                  <div className="w-[200px] min-h-[120px] flex-shrink-0 max-md:w-full max-md:h-[180px]">
                    {stillUrl ? (
                      <img src={stillUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center text-[#555] text-sm">
                        {ep.episode_number}
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center text-white text-xs font-bold">
                        {ep.episode_number}
                      </span>
                      <h3 className="text-white text-base font-medium">{ep.name}</h3>
                    </div>
                    <p className="text-[#999] text-sm leading-[1.7] line-clamp-2">
                      {ep.overview || 'Sem descrição.'}
                    </p>
                    <div className="flex items-center gap-3 mt-3">
                      {ep.runtime > 0 && <span className="text-[#666] text-xs">{ep.runtime} min</span>}
                      {ep.air_date && <span className="text-[#666] text-xs">{ep.air_date}</span>}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {!isMovie && episodes.length === 0 && (
        <div className="w-[1400px] max-w-[95%] mx-auto py-8">
          <p className="text-[#777]">Carregando episódios...</p>
        </div>
      )}

      {showPicker && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8">
          <div className="bg-[#1a1a1a] rounded-2xl p-6 w-full max-w-xs">
            <h2 className="text-white text-base font-bold text-center mb-4">Trocar player</h2>
            {PROVIDERS.map(p => (
              <button
                key={p.value}
                onClick={() => handleSelectProvider(p.value)}
                className={`flex items-center gap-3 w-full p-3.5 rounded-xl mb-2 text-left transition-colors ${
                  provider === p.value
                    ? 'bg-[#222] border border-[#e50914]'
                    : 'bg-[#111] border border-transparent'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  provider === p.value ? 'border-[#e50914]' : 'border-[#555]'
                }`}>
                  {provider === p.value && <div className="w-2.5 h-2.5 rounded-full bg-[#e50914]" />}
                </div>
                <span className={`text-sm font-medium ${provider === p.value ? 'text-white' : 'text-white'}`}>{p.label}</span>
              </button>
            ))}
            <button
              onClick={() => setShowPicker(false)}
              className="w-full text-center text-[#777] text-sm bg-transparent border-none cursor-pointer py-3 mt-1"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
