import { useEffect, useState, useRef } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useMediaStore } from '@/stores/mediaStore'
import { getMovieEmbedUrl, getEpisodeEmbedUrl } from '@/lib/embed'

export function WatchPage() {
  const { type, id } = useParams<{ type: string; id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const store = useMediaStore()
  const [mediaTitle, setMediaTitle] = useState('')

  const season = searchParams.get('s')
  const episode = searchParams.get('e')
  const numId = Number(id) || 0
  const isMovie = type === 'movie'
  const numSeason = Number(season) || 1
  const numEpisode = Number(episode) || 1

  const embedUrl = isMovie
    ? getMovieEmbedUrl(id || '0')
    : getEpisodeEmbedUrl(id || '0', numSeason, numEpisode)

  const pageStartRef = useRef(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const durRef = useRef(0)
  const storeRef = useRef(store)
  storeRef.current = store

  const epKey = `${numId}-${isMovie ? 'movie' : 'tv'}-${isMovie ? 0 : numSeason}-${isMovie ? 0 : numEpisode}`

  useEffect(() => {
    if (!id || !type) return
    clearInterval(intervalRef.current)
    const s = storeRef.current
    const mid = numId
    const movie = isMovie
    const sn = numSeason
    const en = numEpisode
    setMediaTitle('Carregando...')
    pageStartRef.current = Date.now()
    s.addRecentView(mid, movie ? 'movie' : 'tv', movie ? 0 : sn, movie ? 0 : en)

    const fetchFn = movie ? s.getMovieDetails : s.getTVDetails
    fetchFn(mid).then(data => {
      setMediaTitle((data as any).title || (data as any).name || `Mídia #${id}`)
      durRef.current = movie ? ((data as any).runtime || 0) * 60 : 0
    })

    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - pageStartRef.current) / 1000)
      s.saveWatchProgress(mid, movie ? 'movie' : 'tv', elapsed, durRef.current, movie ? 0 : sn, movie ? 0 : en)
    }, 30000)

    return () => {
      clearInterval(intervalRef.current)
      const elapsed = Math.floor((Date.now() - pageStartRef.current) / 1000)
      s.saveWatchProgress(mid, movie ? 'movie' : 'tv', elapsed, durRef.current, movie ? 0 : sn, movie ? 0 : en)
    }
  }, [epKey])

  return (
    <div className="min-h-screen bg-black">
      <div className="bg-black">
        <div className="aspect-video max-h-[85vh] mx-auto relative bg-black">
          <iframe src={embedUrl} className="absolute inset-0 w-full h-full" allowFullScreen loading="lazy" allow="autoplay; fullscreen" />
        </div>

        <div className="flex items-center justify-between px-8 py-4 bg-[#0a0a0a] border-t border-[rgba(255,255,255,.05)]">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="text-white/60 hover:text-white bg-transparent border-none cursor-pointer text-sm transition-colors">← Voltar</button>
            <span className="text-white text-sm font-medium">{mediaTitle}</span>
            {!isMovie && season && episode && <span className="text-[#777] text-xs">T{season} • E{episode}</span>}
          </div>
        </div>
      </div>

      <div className="w-[1400px] max-w-[95%] mx-auto py-8">
        <h2 className="text-xl mb-4">Agora Reproduzindo</h2>
        <p className="text-[#bcbcbc] text-sm leading-[1.8]">{mediaTitle}</p>
      </div>
    </div>
  )
}
