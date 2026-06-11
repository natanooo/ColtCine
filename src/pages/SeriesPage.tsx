import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMediaStore } from '@/stores/mediaStore'
import { useAuthStore } from '@/stores/authStore'
import { MediaRow } from '@/components/shared/MediaRow'

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

export function SeriesPage() {
  const { trending, popularTV, fetchHomeData } = useMediaStore()
  const user = useAuthStore(s => s.user)
  const canWatch = user?.role === 'admin' || user?.permissions?.can_watch_series !== false

  useEffect(() => { fetchHomeData() }, [fetchHomeData])

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

  const seriesTrending = trending.filter(m => m.media_type === 'tv')
  const hero = popularTV[0]
  if (!hero) return null

  const heroTitle = hero.name || ''
  const heroBg = getImg(hero.backdrop_path, 'original')
  const heroGrad = GRADIENTS[hero.id % GRADIENTS.length]

  return (
    <>
      <section className="h-[550px] relative overflow-hidden">
        {heroBg ? (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${heroBg}')` }}>
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 via-black/80 to-[#050505]" />
          </div>
        ) : (
          <div className="absolute inset-0" style={{ background: heroGrad }}>
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 via-black/80 to-[#050505]" />
          </div>
        )}
        <div className="relative z-[2] h-full flex items-end pb-[80px]">
          <div className="w-[1400px] max-w-[95%] mx-auto">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-[650px]">
              <span className="inline-block bg-[#1a1a1a] px-[18px] py-[10px] rounded-full text-xs tracking-[1px] uppercase">Séries</span>
              <h1 className="text-[72px] my-5 leading-[1] font-extrabold max-md:text-[42px]">{heroTitle}</h1>
              <p className="text-[#cfcfcf] text-lg leading-[1.8] line-clamp-3">{hero.overview}</p>
              <Link to={`/tv/${hero.id}`} className="inline-flex h-[56px] px-[35px] rounded-full bg-white text-black font-semibold no-underline items-center justify-center text-sm mt-[25px] hover:bg-white/90 transition-colors">▶ Assistir Agora</Link>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="w-[1400px] max-w-[95%] mx-auto relative z-10 -mt-[60px]">
        {seriesTrending.length > 0 && <MediaRow title="Em Alta" items={seriesTrending} />}
        {popularTV.length > 0 && <MediaRow title="Populares" items={popularTV} />}

        <section className="mb-[70px]">
          <h2 className="text-[28px] mb-[25px] font-semibold">Destaques</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[25px]">
            {popularTV.slice(0, 2).map(m => {
              const img = getImg(m.backdrop_path, 'w780')
              return (
                <Link key={m.id} to={`/tv/${m.id}`} className="bg-[#111] rounded-[24px] overflow-hidden no-underline group">
                  {img ? (
                    <img src={img} alt="" className="h-[250px] w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="h-[250px] flex items-center justify-center" style={{ background: GRADIENTS[m.id % GRADIENTS.length] }}>
                      <span className="text-8xl font-bold text-white/10 select-none">{(m.name || '').charAt(0)}</span>
                    </div>
                  )}
                  <div className="p-[25px]">
                    <h3 className="mb-[10px] text-lg text-white">{m.name}</h3>
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
