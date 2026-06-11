import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMediaStore } from '@/stores/mediaStore'
import { MediaCard } from '@/components/shared/MediaCard'
import type { MediaItem } from '@/types'

export function SearchPage() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const { search } = useMediaStore()
  const [results, setResults] = useState<MediaItem[]>([])

  useEffect(() => {
    if (!query) { setResults([]); return }
    search(query).then(setResults)
  }, [query, search])

  if (!query) {
    return (
      <div className="w-[1400px] max-w-[95%] mx-auto py-20 text-center">
        <h1 className="text-3xl mb-4">Busca</h1>
        <p className="text-[#777]">Digite algo para pesquisar.</p>
      </div>
    )
  }

  return (
    <div className="w-[1400px] max-w-[95%] mx-auto py-10">
      <h1 className="text-[28px] mb-[25px] font-semibold">Resultados para: "{query}"</h1>
      {results.length === 0 ? (
        <p className="text-[#777]">Nenhum resultado encontrado.</p>
      ) : (
        <div className="flex flex-wrap gap-[18px]">
          {results.map(item => <MediaCard key={`${item.id}-${item.media_type}`} item={item} />)}
        </div>
      )}
    </div>
  )
}
