export type PageRoute = 'home' | 'regulations' | 'conference' | 'consent' | 'privacy'

// Hash-маршруты поддерживают прямой вход на статическом GitHub Pages.
export function pageFromHash(hash: string): PageRoute {
  if (hash === '#/regulations') return 'regulations'
  if (hash === '#/conference') return 'conference'
  if (hash === '#/consent') return 'consent'
  if (hash === '#/privacy') return 'privacy'
  return 'home'
}
