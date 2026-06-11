import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { MediaItem } from '@/types'

interface Props {
  item: MediaItem
  progress?: number
  showTitle?: boolean
}

const COLORS = [
  '#1a1a2e', '#16213e', '#0f3460', '#533483',
  '#2d1b69', '#1c0a33', '#0d1117', '#10002b',
  '#240046', '#3c096c', '#5a189a', '#7b2cbf',
]

function bg(id: number) { return COLORS[id % COLORS.length] }

export function MediaCard({ item, progress, showTitle = true }: Props) {
  const [imgError, setImgError] = useState(false)
  const title = item.title || item.name || 'Sem título'
  const t = item.media_type || 'movie'
  const linkTo = t === 'movie' ? `/movie/${item.id}` : `/tv/${item.id}`
  const initial = title.charAt(0).toUpperCase()
  const posterUrl = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null
  const hasImage = posterUrl && !imgError

  return (
    <motion.div whileHover={{ y: -8 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} className="w-[180px] min-w-[180px] md:w-[220px] md:min-w-[220px] flex-shrink-0">
      <Link to={linkTo} className="no-underline">
        <div className="rounded-[18px] overflow-hidden aspect-[2/3] flex items-center justify-center" style={{ backgroundColor: bg(item.id) }}>
          {hasImage ? (
            <img src={posterUrl} alt={title} loading="lazy" className="w-full h-full object-cover" onError={() => setImgError(true)} />
          ) : (
            <span className="text-6xl font-bold text-white/20 select-none">{initial}</span>
          )}
        </div>
        {progress !== undefined && (
          <div className="mt-[10px] h-[5px] bg-[#242424] rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
        )}
        {showTitle && <p className="mt-3 text-sm text-[#d0d0d0] truncate">{title}</p>}
      </Link>
    </motion.div>
  )
}
