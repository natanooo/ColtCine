import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMediaStore } from '@/stores/mediaStore'
import { MediaRow } from '@/components/shared/MediaRow'
import type { MediaItem } from '@/types'

const GRADIENTS = [
  'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
  'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
  'linear-gradient(135deg, #2d1b69, #1c0a33, #0d1117)',
  'linear-gradient(135deg, #10002b, #240046, #3c096c)',
  'linear-gradient(135deg, #0a0a0a, #1a1a2e, #16213e)',
]

function getImg(path: string | null, size: string) {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : null
}

export function DashboardPage() {
  const { trending, popularMovies, popularTV, featured, fetchHomeData, fetchFavorites, fetchWatchlist, favorites, watchlist, getMediaById } = useMediaStore()
  const [favItems, setFavItems] = useState<MediaItem[]>([])
  const [wlItems, setWlItems] = useState<MediaItem[]>([])

  useEffect(() => {
    fetchHomeData()
    fetchFavorites()
    fetchWatchlist()
  }, [fetchHomeData, fetchFavorites, fetchWatchlist])

  useEffect(() => {
    Promise.all(favorites.map((f: any) => getMediaById(f.media_id as number, f.media_type as 'movie' | 'tv')))
      .then(r => setFavItems(r.filter(Boolean) as MediaItem[]))
  }, [favorites, getMediaById])

  useEffect(() => {
    Promise.all(watchlist.map((f: any) => getMediaById(f.media_id as number, f.media_type as 'movie' | 'tv')))
      .then(r => setWlItems(r.filter(Boolean) as MediaItem[]))
  }, [watchlist, getMediaById])

  const hero = featured || popularMovies[0]
  if (!hero) return null

  const heroTitle = hero.title || hero.name || ''
  const heroBg = getImg(hero.backdrop_path, 'original')
  const heroGrad = GRADIENTS[hero.id % GRADIENTS.length]
  const heroType = hero.media_type || 'movie'
  const heroLink = heroType === 'movie' ? `/movie/${hero.id}` : `/tv/${hero.id}`

  return (
    <>
      <section className="h-screen relative overflow-hidden">
        {heroBg ? (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${heroBg}')` }}>
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 via-black/80 to-[#050505]" />
          </div>
        ) : (
          <div className="absolute inset-0" style={{ background: heroGrad }}>
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 via-black/80 to-[#050505]" />
          </div>
        )}
        <div className="relative z-[2] h-full flex items-end pb-[120px]">
          <div className="w-[1400px] max-w-[95%] mx-auto">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-[650px]">
              <span className="inline-block bg-[#1a1a1a] px-[18px] py-[10px] rounded-full text-xs tracking-[1px] uppercase">Filme em Destaque</span>
              <h1 className="text-[82px] my-5 leading-[1] font-extrabold max-md:text-[52px]">{heroTitle}</h1>
              <p className="text-[#cfcfcf] text-lg leading-[1.8] line-clamp-3">{hero.overview}</p>
              <div className="flex gap-[15px] mt-[35px] flex-wrap">
                <Link to={heroLink} className="h-[56px] px-[35px] rounded-full bg-white text-black font-semibold no-underline flex items-center justify-center text-sm hover:bg-white/90 transition-colors">▶ Assistir Agora</Link>
                <Link to={heroLink} className="h-[56px] px-[35px] rounded-full bg-[#1c1c1c] text-white no-underline flex items-center justify-center text-sm hover:bg-[#2a2a2a] transition-colors">Mais Informações</Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="w-[1400px] max-w-[95%] mx-auto relative z-10 -mt-[60px]">
        {favItems.length > 0 && <MediaRow title="Favoritos" items={favItems} />}
        {wlItems.length > 0 && <MediaRow title="Minha Lista" items={wlItems} />}
        {trending.length > 0 && <MediaRow title="Em Alta" items={trending} />}
        {popularMovies.length > 0 && <MediaRow title="Filmes Populares" items={popularMovies} />}
        {popularTV.length > 0 && <MediaRow title="Séries Populares" items={popularTV} />}

        <section className="mb-[70px]">
          <h2 className="text-[28px] mb-[25px] font-semibold">Destaques da Semana</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[25px]">
            {popularMovies.slice(0, 2).map(m => {
              const img = getImg(m.backdrop_path, 'w780')
              return (
                <Link key={m.id} to={`/movie/${m.id}`} className="bg-[#111] rounded-[24px] overflow-hidden no-underline group">
                  {img ? (
                    <img src={img} alt="" className="h-[250px] w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="h-[250px] flex items-center justify-center" style={{ background: GRADIENTS[m.id % GRADIENTS.length] }}>
                      <span className="text-8xl font-bold text-white/10 select-none">{(m.title || '').charAt(0)}</span>
                    </div>
                  )}
                  <div className="p-[25px]">
                    <h3 className="mb-[10px] text-lg text-white">{m.title || m.name}</h3>
                    <p className="text-[#bcbcbc] leading-[1.8] text-sm line-clamp-2">{m.overview}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      </div>
    </>
  )
}
