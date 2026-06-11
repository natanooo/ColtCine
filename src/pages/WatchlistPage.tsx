import { useEffect, useState } from 'react'
import { useMediaStore } from '@/stores/mediaStore'
import { MediaCard } from '@/components/shared/MediaCard'
import type { MediaItem } from '@/types'

export function WatchlistPage() {
  const { fetchWatchlist, watchlist, getMediaById } = useMediaStore()
  const [items, setItems] = useState<MediaItem[]>([])

  useEffect(() => { fetchWatchlist() }, [fetchWatchlist])

  useEffect(() => {
    Promise.all(watchlist.map((item: any) => getMediaById(item.media_id as number, item.media_type as 'movie' | 'tv')))
      .then(results => setItems(results.filter(Boolean) as MediaItem[]))
  }, [watchlist, getMediaById])

  return (
    <div className="w-[1400px] max-w-[95%] mx-auto py-10">
      <h1 className="text-[28px] mb-[25px] font-semibold">Minha Lista</h1>
      {items.length === 0 ? (
        <p className="text-[#777]">Nenhum item na lista.</p>
      ) : (
        <div className="flex flex-wrap gap-[18px]">
          {items.map(item => <MediaCard key={`wl-${item.id}`} item={item} />)}
        </div>
      )}
    </div>
  )
}
