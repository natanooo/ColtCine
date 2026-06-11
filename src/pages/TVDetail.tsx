import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useMediaStore } from '@/stores/mediaStore'
import { useAuthStore } from '@/stores/authStore'
import type { TVDetail as TVDetailType } from '@/types'

const GRADIENTS = [
  'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
  'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
  'linear-gradient(135deg, #2d1b69, #1c0a33, #0d1117)',
  'linear-gradient(135deg, #10002b, #240046, #3c096c)',
  'linear-gradient(135deg, #0a0a0a, #1a1a2e, #16213e)',
  'linear-gradient(135deg, #42275a, #734b6d)',
  'linear-gradient(135deg, #2c3e50, #3498db)',
  'linear-gradient(135deg, #23074d, #cc5333)',
]

function getImg(path: string | null, size: string) {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : null
}

export function TVDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { getTVDetails, isFavorite, addFavorite, removeFavorite, isInWatchlist, addToWatchlist, removeFromWatchlist } = useMediaStore()
  const [tv, setTV] = useState<TVDetailType | null>(null)
  const [selectedSeason, setSelectedSeason] = useState(1)
  const [isFav, setIsFav] = useState(false)
  const [isWL, setIsWL] = useState(false)
  const [imgErr, setImgErr] = useState(false)
  const [posterErr, setPosterErr] = useState(false)
  const numId = Number(id)

  useEffect(() => {
    if (!id) return
    setImgErr(false); setPosterErr(false)
    getTVDetails(numId).then(data => {
      setTV(data)
      const first = data.seasons?.find((s: any) => s.season_number > 0)
      setSelectedSeason(first?.season_number || 1)
    })
    isFavorite(numId, 'tv').then(setIsFav)
    isInWatchlist(numId, 'tv').then(setIsWL)
  }, [id, numId, getTVDetails, isFavorite, isInWatchlist])

  const user = useAuthStore(s => s.user)
  const canWatch = user?.role === 'admin' || user?.permissions?.can_watch_series !== false
  const canFav = user?.role === 'admin' || user?.permissions?.can_use_favorites !== false
  const canWL = user?.role === 'admin' || user?.permissions?.can_use_watchlist !== false

  if (!tv) return null

  if (!canWatch) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-6xl mb-4">🚫</p>
          <h2 className="text-2xl font-bold mb-2">Acesso Restrito</h2>
          <p className="text-[#999]">Sua conta não tem permissão para assistir séries.</p>
        </div>
      </div>
    )
  }

  const initial = tv.name.charAt(0).toUpperCase()
  const bgUrl = tv.backdrop_path ? `https://image.tmdb.org/t/p/original${tv.backdrop_path}` : null
  const posterUrl = tv.poster_path ? `https://image.tmdb.org/t/p/w500${tv.poster_path}` : null
  const bgGrad = GRADIENTS[tv.id % GRADIENTS.length]
  const filteredSeasons = tv.seasons?.filter((s: any) => s.season_number > 0) || []

  const currentSeason = tv.seasons?.find((s: any) => s.season_number === selectedSeason)
  const episodes = currentSeason?.episodes || []

  return (
    <>
      <section className="h-[600px] relative overflow-hidden">
        {bgUrl && !imgErr ? (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${bgUrl}')` }}>
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-[#050505]" />
          </div>
        ) : (
          <div className="absolute inset-0" style={{ background: bgGrad }}>
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-[#050505]" />
          </div>
        )}
        <div className="relative z-[2] h-full flex items-end pb-20">
          <div className="w-[1400px] max-w-[95%] mx-auto">
            <div className="flex gap-10 items-end max-md:flex-col max-md:items-start">
              <div className="w-[220px] flex-shrink-0 max-md:w-[140px]">
                {posterUrl && !posterErr ? (
                  <img src={posterUrl} alt={tv.name} className="rounded-[18px] shadow-[0_25px_60px_rgba(0,0,0,.5)]" onError={() => setPosterErr(true)} />
                ) : (
                  <div className="rounded-[18px] aspect-[2/3] flex items-center justify-center shadow-[0_25px_60px_rgba(0,0,0,.5)]" style={{ background: bgGrad }}>
                    <span className="text-7xl font-bold text-white/20 select-none">{initial}</span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-[48px] mb-3 font-bold max-md:text-[32px]">{tv.name}</h1>
                <div className="text-[#bfbfbf] mb-[15px] text-sm">
                  {tv.first_air_date}
                  {tv.number_of_seasons > 0 && ` • ${tv.number_of_seasons} Temporada${tv.number_of_seasons > 1 ? 's' : ''}`}
                  {tv.number_of_episodes > 0 && ` • ${tv.number_of_episodes} Episódio${tv.number_of_episodes > 1 ? 's' : ''}`}
                  {tv.genres?.length > 0 && ` • ${tv.genres.slice(0, 3).map(g => g.name).join(', ')}`}
                </div>
                <p className="text-[#cfcfcf] leading-[1.8] text-sm line-clamp-3">{tv.overview}</p>
                <div className="mt-4 flex gap-2.5 flex-wrap">
                  {tv.genres?.map((g: any) => <span key={g.id} className="px-[18px] py-[10px] rounded-full bg-[#1b1b1b] text-xs">{g.name}</span>)}
                </div>
                <div className="flex gap-3 mt-5">
                  <button disabled={!canFav} onClick={async () => { isFav ? await removeFavorite(numId, 'tv') : await addFavorite(numId, 'tv'); setIsFav(!isFav) }} className={`h-[45px] px-6 rounded-full text-sm border-none flex items-center justify-center transition-colors ${canFav ? 'bg-[#1c1c1c] text-white cursor-pointer hover:bg-[#2a2a2a]' : 'bg-[#111] text-[#555] cursor-not-allowed'}`} title={!canFav ? 'Sem permissão' : ''}>{isFav ? '❤️ Favoritado' : '🤍 Favoritar'}</button>
                  <button disabled={!canWL} onClick={async () => { isWL ? await removeFromWatchlist(numId, 'tv') : await addToWatchlist(numId, 'tv'); setIsWL(!isWL) }} className={`h-[45px] px-6 rounded-full text-sm border-none flex items-center justify-center transition-colors ${canWL ? 'bg-[#1c1c1c] text-white cursor-pointer hover:bg-[#2a2a2a]' : 'bg-[#111] text-[#555] cursor-not-allowed'}`} title={!canWL ? 'Sem permissão' : ''}>{isWL ? '✅ Na Lista' : '➕ Minha Lista'}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="w-[1400px] max-w-[95%] mx-auto mt-10">
        <div className="mb-[60px]">
          <h2 className="text-2xl mb-[25px]">Temporadas</h2>

          {filteredSeasons.length > 0 && (
            <div className="flex gap-3 flex-wrap mb-8">
              {filteredSeasons.map((s: any) => (
                <button key={s.id} onClick={() => setSelectedSeason(s.season_number)}
                  className={`px-5 py-3 rounded-full text-sm border-none cursor-pointer transition-all ${selectedSeason === s.season_number ? 'bg-white text-black' : 'bg-[#1c1c1c] text-white hover:bg-[#2a2a2a]'}`}>
                  {s.name || `Temporada ${s.season_number}`}
                </button>
              ))}
            </div>
          )}

          {episodes.length > 0 ? (
            <div className="flex flex-col gap-4">
              {episodes.map((ep: any) => {
                const stillUrl = getImg(ep.still_path, 'w300')
                return (
                  <Link key={ep.id} to={`/watch/tv/${tv.id}?s=${selectedSeason}&e=${ep.episode_number}`}
                    className="bg-[#111] rounded-[18px] overflow-hidden no-underline flex gap-4 hover:bg-[#1a1a1a] transition-colors max-md:flex-col">
                    <div className="w-[200px] min-h-[120px] flex-shrink-0 max-md:w-full max-md:h-[180px]">
                      {stillUrl ? (
                        <img src={stillUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center text-[#555] text-sm">{ep.episode_number}</div>
                      )}
                    </div>
                    <div className="p-4 flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center text-white text-xs font-bold">{ep.episode_number}</span>
                        <h3 className="text-white text-base font-medium">{ep.name}</h3>
                      </div>
                      <p className="text-[#999] text-sm leading-[1.7] line-clamp-2">{ep.overview || 'Sem descrição.'}</p>
                      <div className="flex items-center gap-3 mt-3">
                        {ep.runtime > 0 && <span className="text-[#666] text-xs">{ep.runtime} min</span>}
                        {ep.air_date && <span className="text-[#666] text-xs">{ep.air_date}</span>}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-[#777] mb-4">Episódios disponíveis no player.</p>
              <Link to={`/watch/tv/${tv.id}?s=${selectedSeason}&e=1`} className="inline-block px-8 py-3 rounded-full bg-white text-black font-semibold text-sm no-underline hover:bg-white/90 transition-colors">▶ Assistir Temporada {selectedSeason}</Link>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
