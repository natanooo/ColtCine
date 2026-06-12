const KEY = 'coltcine_provider'

export type Provider = 'auto' | 'watchplayer' | 'embedplayer2'

export function hasStoredProvider(): boolean {
  return localStorage.getItem(KEY) !== null
}

export function getStoredProvider(): Provider {
  try {
    const val = localStorage.getItem(KEY)
    if (val === 'auto' || val === 'watchplayer' || val === 'embedplayer2') return val
  } catch {}
  return 'auto'
}

export function setStoredProvider(p: Provider): void {
  localStorage.setItem(KEY, p)
}
