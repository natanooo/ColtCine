import { MediaCard } from './MediaCard'
import type { MediaItem } from '@/types'

interface Props {
  title: string
  items: MediaItem[]
}

export function MediaRow({ title, items }: Props) {
  if (!items.length) return null
  return (
    <section className="mb-[70px]">
      <h2 className="text-[28px] mb-[25px] font-semibold">{title}</h2>
      <div className="flex gap-[18px] overflow-x-auto pb-2.5 scrollbar-hide">
        {items.map(item => (
          <MediaCard key={`${item.media_type}-${item.id}`} item={item} />
        ))}
      </div>
    </section>
  )
}
