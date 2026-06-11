import { useEffect, useState } from 'react'
import { useMediaStore } from '@/stores/mediaStore'
import { MediaCard } from '@/components/shared/MediaCard'
import type { MediaItem } from '@/types'

export function FavoritesPage() {
  const { fetchFavorites, favorites, getMediaById } = useMediaStore()
  const [items, setItems] = useState<MediaItem[]>([])

  useEffect(() => { fetchFavorites() }, [fetchFavorites])

  useEffect(() => {
    Promise.all(favorites.map((fav: any) => getMediaById(fav.media_id as number, fav.media_type as 'movie' | 'tv')))
      .then(results => setItems(results.filter(Boolean) as MediaItem[]))
  }, [favorites, getMediaById])

  return (
    <div className="w-[1400px] max-w-[95%] mx-auto py-10">
      <h1 className="text-[28px] mb-[25px] font-semibold">Meus Favoritos</h1>
      {items.length === 0 ? (
        <p className="text-[#777]">Nenhum favorito ainda.</p>
      ) : (
        <div className="flex flex-wrap gap-[18px]">
          {items.map(item => <MediaCard key={`fav-${item.id}`} item={item} />)}
        </div>
      )}
    </div>
  )
}
