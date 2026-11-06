import logo from '../assets/images/logo.png'

// Vite видит каждый файл и создаёт хэшированные URL, в том числе для GitHub Pages.
const posters = import.meta.glob<string>('../assets/images/posters/*.webp', {
  eager: true,
  import: 'default',
  query: '?url',
})

export function posterUrl(id: string): string {
  const url = posters[`../assets/images/posters/${id}.webp`]
  if (!url) throw new Error(`Missing championship poster: ${id}`)
  return url
}

export { logo }
