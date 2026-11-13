export type PageRoute = 'home' | 'regulations' | 'conference'

// Hash-маршруты поддерживают прямой вход на статическом GitHub Pages.
export function pageFromHash(hash: string): PageRoute {
  if (hash === '#/regulations') return 'regulations'
  if (hash === '#/conference') return 'conference'
  return 'home'
}
