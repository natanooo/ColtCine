import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useMediaStore } from '@/stores/mediaStore'
import { turso } from '@/lib/turso'
import { MediaCard } from '@/components/shared/MediaCard'
import { AvatarPicker } from '@/components/shared/AvatarPicker'
import type { MediaItem } from '@/types'

const IMG_BASE = 'https://image.tmdb.org/t/p'

export function ProfilePage() {
  const user = useAuthStore(s => s.user)
  const setUser = useAuthStore(s => s.setUser)
  const { getMediaById, getContinueWatching } = useMediaStore()
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [stats, setStats] = useState({ movies: 0, series: 0, hours: 0, favorites: 0 })
  const [favItems, setFavItems] = useState<MediaItem[]>([])
  const [continueItems, setContinueItems] = useState<any[]>([])
  const [continueMedia, setContinueMedia] = useState<Record<string, MediaItem | null>>({})

  useEffect(() => {
    if (!user) return
    ;(async () => {
      const [moviesRs, seriesRs, hoursRs, favRs, favItemsRs, continueRs] = await Promise.all([
        turso.execute({ sql: 'SELECT COUNT(*) as c FROM watch_history WHERE user_id = ? AND media_type = ? AND completed = 1', args: [user.id, 'movie'] }).catch(() => ({ rows: [{ c: 0 }] })),
        turso.execute({ sql: 'SELECT COUNT(*) as c FROM watch_history WHERE user_id = ? AND media_type = ? AND completed = 1', args: [user.id, 'tv'] }).catch(() => ({ rows: [{ c: 0 }] })),
        turso.execute({ sql: "SELECT COALESCE(SUM(watched_time), 0) as t FROM watch_history WHERE user_id = ? AND completed = 1", args: [user.id] }).catch(() => ({ rows: [{ t: 0 }] })),
        turso.execute({ sql: 'SELECT COUNT(*) as c FROM favorites WHERE user_id = ?', args: [user.id] }).catch(() => ({ rows: [{ c: 0 }] })),
        turso.execute({ sql: 'SELECT media_id, media_type FROM favorites WHERE user_id = ? ORDER BY created_at DESC LIMIT 10', args: [user.id] }).catch(() => ({ rows: [] })),
        getContinueWatching().catch(() => []),
      ])
      setStats({
        movies: Number(moviesRs.rows[0]?.c || 0),
        series: Number(seriesRs.rows[0]?.c || 0),
        hours: Math.round(Number(hoursRs.rows[0]?.t || 0) / 3600),
        favorites: Number(favRs.rows[0]?.c || 0),
      })
      const resolved = await Promise.all(favItemsRs.rows.map(r => getMediaById(r.media_id as number, r.media_type as 'movie' | 'tv').catch(() => null)))
      setFavItems(resolved.filter(Boolean) as MediaItem[])

      const cw = continueRs || []
      setContinueItems(cw)
      const cwMap: Record<string, MediaItem | null> = {}
      await Promise.all(cw.map(async (item: any) => {
        const key = `${item.media_type}-${item.media_id}`
        const m = await getMediaById(item.media_id as number, item.media_type as 'movie' | 'tv').catch(() => null)
        cwMap[key] = m
      }))
      setContinueMedia(cwMap)
    })()
  }, [user, getMediaById, getContinueWatching])

  if (!user) return null

  const handleAvatarChange = async (url: string) => {
    await turso.execute({
      sql: "UPDATE users SET avatar = ?, updated_at = datetime('now') WHERE id = ?",
      args: [url, user.id],
    })
    setUser({ ...user, avatar: url })
    setShowAvatarPicker(false)
  }

  return (
    <>
      {showAvatarPicker && (
        <AvatarPicker
          selected={user.avatar}
          onSelect={handleAvatarChange}
          onClose={() => setShowAvatarPicker(false)}
        />
      )}
      <section className="h-[500px] relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center before:absolute before:inset-0 before:bg-gradient-to-b before:from-black/30 before:via-black/60 before:to-[#050505]"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=2000&q=80')` }} />
        <div className="relative z-[2] h-full flex items-end pb-[60px]">
          <div className="w-[1400px] max-w-[95%] mx-auto">
            <div className="flex items-center gap-[30px] max-md:flex-col max-md:text-center">
              <div className="w-[150px] h-[150px] rounded-full border-4 border-[rgba(255,255,255,.1)] overflow-hidden flex-shrink-0 relative group cursor-pointer" onClick={() => setShowAvatarPicker(true)}>
                {user.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-[#222] flex items-center justify-center text-4xl font-bold">{user.name.charAt(0).toUpperCase()}</div>}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium">Alterar</div>
              </div>
              <div>
                <h1 className="text-[48px] mb-2.5 font-bold max-md:text-[36px]">{user.name}</h1>
                <p className="text-[#bbb] text-sm">Membro desde {new Date(user.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                <div className="mt-[15px] inline-block px-[18px] py-[10px] bg-[#111] rounded-full text-sm">⭐ Cinéfilo Premium</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="w-[1400px] max-w-[95%] mx-auto">
        <section className="grid grid-cols-4 gap-5 -mt-10 relative z-10 max-md:grid-cols-2">
          {[
            { value: stats.movies, label: 'Filmes Assistidos' },
            { value: stats.series, label: 'Séries Assistidas' },
            { value: `${stats.hours}h`, label: 'Tempo Assistido' },
            { value: stats.favorites, label: 'Favoritos' },
          ].map(s => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#111] rounded-[22px] p-[30px]">
              <h2 className="text-[42px] mb-2.5 font-bold">{s.value}</h2>
              <span className="text-[#999] text-sm">{s.label}</span>
            </motion.div>
          ))}
        </section>

        {continueItems.length > 0 && (
          <section className="mt-[70px]">
            <h2 className="text-[28px] mb-[25px] font-semibold">Continuar Assistindo</h2>
            <div className="flex flex-wrap gap-[18px]">
              {continueItems.map((item: any) => {
                const key = `${item.media_type}-${item.media_id}`
                const media = continueMedia[key]
                const pct = item.total_duration > 0 ? Math.min((item.watched_time / item.total_duration) * 100, 99) : 0
                const label = item.media_type === 'movie' ? `/watch/movie/${item.media_id}?t=${Math.floor(item.watched_time)}` : `/watch/tv/${item.media_id}?s=${item.season_number || 1}&e=${item.episode_number || 1}&t=${Math.floor(item.watched_time)}`
                const isSeries = item.media_type === 'tv'
                const poster = media?.poster_path ? `${IMG_BASE}/w200${media.poster_path}` : null
                const title = media?.title || media?.name || `#${item.media_id}`
                return (
                  <Link key={`cw-${item.media_id}-${item.season_number || 0}-${item.episode_number || 0}`} to={label} className="bg-[#111] rounded-[18px] overflow-hidden w-[180px] flex-shrink-0 no-underline group hover:bg-[#181818] transition-colors">
                    <div className="h-[150px] bg-[#1a1a1a] overflow-hidden">
                      {poster ? <img src={poster} alt="" className="w-full h-full object-cover" /> : (
                        <div className="w-full h-full flex items-center justify-center text-[#555] text-[11px] px-2 text-center">{title}</div>
                      )}
                    </div>
                    <div className="p-[12px]">
                      <p className="text-white text-sm truncate leading-tight">{title}</p>
                      {isSeries && <p className="text-[#999] text-xs mt-1">T{item.season_number} E{item.episode_number}</p>}
                      <div className="mt-2 h-[4px] bg-[#242424] rounded-full overflow-hidden">
                        <div className="h-full bg-white rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        <section className="mt-[70px] mb-[70px]">
          <h2 className="text-[28px] mb-[25px] font-semibold">Meus Favoritos</h2>
          <div className="grid grid-cols-5 gap-5 max-md:grid-cols-2">
            {favItems.length > 0 ? favItems.map((item, i) => <MediaCard key={`pfav-${(item as MediaItem).id}-${i}`} item={item as MediaItem} />) : <p className="text-[#777] col-span-full text-sm">Nenhum favorito ainda.</p>}
          </div>
        </section>
      </div>
    </>
  )
}
