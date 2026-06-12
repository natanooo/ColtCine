import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useMediaStore } from '@/stores/mediaStore'
import { useAuthStore } from '@/stores/authStore'
import { PlayIcon, HeartIcon, HeartOutlineIcon, CheckIcon, PlusIcon, StarIcon, RestrictedIcon } from '@/components/shared/Icons'
import type { MovieDetail as MovieDetailType } from '@/types'

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

export function MovieDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { getMovieDetails, isFavorite, addFavorite, removeFavorite, isInWatchlist, addToWatchlist, removeFromWatchlist } = useMediaStore()
  const [movie, setMovie] = useState<MovieDetailType | null>(null)
  const [isFav, setIsFav] = useState(false)
  const [isWL, setIsWL] = useState(false)
  const [imgErr, setImgErr] = useState(false)
  const [posterErr, setPosterErr] = useState(false)
  const numId = Number(id)

  useEffect(() => {
    if (!id) return
    setImgErr(false); setPosterErr(false)
    getMovieDetails(numId).then(setMovie)
    isFavorite(numId, 'movie').then(setIsFav)
    isInWatchlist(numId, 'movie').then(setIsWL)
  }, [id, numId, getMovieDetails, isFavorite, isInWatchlist])

  const user = useAuthStore(s => s.user)
  const canWatch = user?.role === 'admin' || user?.permissions?.can_watch_movies !== false
  const canFav = user?.role === 'admin' || user?.permissions?.can_use_favorites !== false
  const canWL = user?.role === 'admin' || user?.permissions?.can_use_watchlist !== false

  if (!movie) return null

  if (!canWatch) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <RestrictedIcon size={48} className="mb-4 mx-auto" />
          <h2 className="text-2xl font-bold mb-2">Acesso Restrito</h2>
          <p className="text-[#999]">Sua conta não tem permissão para assistir filmes.</p>
        </div>
      </div>
    )
  }

  const initial = movie.title.charAt(0).toUpperCase()
  const bgUrl = movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : null
  const posterUrl = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null
  const bgGrad = GRADIENTS[movie.id % GRADIENTS.length]

  return (
    <>
      <section className="h-[700px] relative overflow-hidden">
        {bgUrl && !imgErr ? (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${bgUrl}')` }}>
            <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/45 to-[#0b0b0b]" />
          </div>
        ) : (
          <div className="absolute inset-0" style={{ background: bgGrad }}>
            <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/45 to-[#0b0b0b]" />
          </div>
        )}
        <div className="relative z-[5] h-full flex items-end pb-20">
          <div className="w-[1200px] max-w-[95%] mx-auto">
            <div className="flex gap-10 items-end max-md:flex-col max-md:items-start">
              <div className="w-[220px] flex-shrink-0 max-md:w-[140px]">
                {posterUrl && !posterErr ? (
                  <img src={posterUrl} alt={movie.title} className="rounded-[18px] shadow-[0_25px_60px_rgba(0,0,0,.5)]" onError={() => setPosterErr(true)} />
                ) : (
                  <div className="rounded-[18px] aspect-[2/3] flex items-center justify-center shadow-[0_25px_60px_rgba(0,0,0,.5)]" style={{ background: bgGrad }}>
                    <span className="text-7xl font-bold text-white/20 select-none">{initial}</span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-[58px] mb-3 font-bold max-md:text-[36px]">{movie.title}</h1>
                <div className="text-[#bfbfbf] mb-[25px] text-sm">
                  {movie.release_date}{movie.runtime > 0 && ` • ${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`}
                  {movie.genres?.length > 0 && ` • ${movie.genres.slice(0, 3).map(g => g.name).join(', ')}`}
                </div>
                <p className="text-[#cfcfcf] leading-[1.8] text-sm">{movie.overview}</p>
                <div className="mt-[25px] flex gap-2.5 flex-wrap">
                  {movie.genres?.map(g => <span key={g.id} className="px-[18px] py-[10px] rounded-full bg-[#1b1b1b] text-xs">{g.name}</span>)}
                </div>
                <div className="flex gap-3 mt-6 items-center">
                  <Link to={`/watch/movie/${movie.id}`} className="h-[52px] px-8 rounded-full bg-white text-black font-semibold flex items-center justify-center gap-2 no-underline text-sm hover:bg-white/90 transition-colors"><PlayIcon size={16} color="#000" /> Assistir</Link>
                  <button disabled={!canFav} onClick={async () => { isFav ? await removeFavorite(numId, 'movie') : await addFavorite(numId, 'movie'); setIsFav(!isFav) }} className={`h-[52px] w-[52px] rounded-full border-none flex items-center justify-center transition-colors ${canFav ? 'bg-[#1d1d1d] text-white cursor-pointer hover:bg-[#2a2a2a]' : 'bg-[#111] text-[#555] cursor-not-allowed'}`} title={!canFav ? 'Sem permissão' : ''}>{isFav ? <HeartIcon size={22} /> : <HeartOutlineIcon size={22} />}</button>
                  <button disabled={!canWL} onClick={async () => { isWL ? await removeFromWatchlist(numId, 'movie') : await addToWatchlist(numId, 'movie'); setIsWL(!isWL) }} className={`h-[52px] w-[52px] rounded-full border-none flex items-center justify-center transition-colors ${canWL ? 'bg-[#1d1d1d] text-white cursor-pointer hover:bg-[#2a2a2a]' : 'bg-[#111] text-[#555] cursor-not-allowed'}`} title={!canWL ? 'Sem permissão' : ''}>{isWL ? <CheckIcon size={22} /> : <PlusIcon size={22} />}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#111] p-[60px] rounded-[25px_25px_0_0] -mt-[50px] relative z-10 max-md:p-5">
        <div className="w-[1200px] max-w-[100%] mx-auto">
          <div className="mb-[60px]">
            <h2 className="text-2xl mb-[25px]">Avaliação</h2>
            <div className="flex items-center gap-4">
              <span className="text-[56px] font-bold flex items-center gap-2"><StarIcon size={48} /> {movie.vote_average.toFixed(1)}</span>
              <span className="bg-[#1f1f1f] px-[18px] py-[10px] rounded-full text-sm">{Math.round(movie.vote_average * 10)}%</span>
            </div>
          </div>

          {movie.credits?.cast?.length > 0 && (
            <div className="mb-[60px]">
              <h2 className="text-2xl mb-[25px]">Elenco</h2>
              <div className="flex gap-[25px] overflow-x-auto scrollbar-hide">
                {movie.credits.cast.map(a => (
                  <div key={a.id} className="text-center flex-shrink-0">
                    <div className="w-20 h-20 rounded-full bg-[#222] mx-auto flex items-center justify-center text-lg font-bold text-[#777]">{a.name.charAt(0)}</div>
                    <span className="block mt-2.5 text-xs text-[#d0d0d0]">{a.name}</span>
                    <span className="block text-[10px] text-[#777]">{a.character}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-[60px]">
            <h2 className="text-2xl mb-[25px]">Sinopse</h2>
            <div className="bg-[#1a1a1a] rounded-[18px] p-[30px]">
              <p className="text-[#bdbdbd] leading-[1.9] text-sm">{movie.overview}</p>
            </div>
          </div>

          {movie.similar?.length > 0 && (
            <div className="mb-[60px]">
              <h2 className="text-2xl mb-[25px]">Semelhantes</h2>
              <div className="flex gap-[15px] overflow-x-auto scrollbar-hide">
                {movie.similar.slice(0, 10).map((item: any) => (
                  <Link key={item.id} to={`/movie/${item.id}`} className="flex-shrink-0">
                    {item.poster_path ? (
                      <img src={`https://image.tmdb.org/t/p/w200${item.poster_path}`} alt={item.title || ''} className="w-[130px] rounded-[12px]" />
                    ) : (
                      <div className="w-[130px] aspect-[2/3] rounded-[12px] flex items-center justify-center" style={{ background: GRADIENTS[item.id % GRADIENTS.length] }}>
                        <span className="text-3xl font-bold text-white/20 select-none">{(item.title || item.name || '').charAt(0)}</span>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
