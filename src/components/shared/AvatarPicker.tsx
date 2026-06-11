const CHARACTERS = [
  'Cyborg', 'Robin', 'Raven', 'Beast Boy', 'Starfire',
  'Mordecai', 'Rigby', 'Muscle Man', 'Skips', 'Pops',
  'Aang', 'Katara', 'Sokka', 'Zuko', 'Toph',
]

interface Props {
  selected: string
  onSelect: (url: string) => void
  onClose: () => void
}

export function AvatarPicker({ selected, onSelect, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="bg-[#111] border border-[#1d1d1d] rounded-3xl p-8 w-[500px] max-w-[95vw] max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Escolher Avatar</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-[#1a1a1a] border border-[#252525] text-white cursor-pointer flex items-center justify-center hover:bg-[#222] transition-colors text-sm">✕</button>
        </div>

        <div className="grid grid-cols-5 gap-3">
          {CHARACTERS.map(name => {
            const url = `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(name)}`
            return (
              <button
                key={name}
                onClick={() => onSelect(url)}
                className={`w-full aspect-square rounded-2xl overflow-hidden border-2 cursor-pointer transition-all duration-200 bg-[#1a1a1a] ${
                  selected === url ? 'border-white scale-105' : 'border-transparent hover:border-[#444]'
                }`}
                title={name}
              >
                <img src={url} alt={name} className="w-full h-full object-cover" />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}