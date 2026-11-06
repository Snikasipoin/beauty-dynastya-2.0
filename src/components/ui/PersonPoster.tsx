import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { posterUrl } from '../../lib/assets'

interface PersonPosterProps {
  poster: string
  name: string
  className?: string
  fit?: 'contain' | 'cover'
  layout?: 'portrait' | 'speaker'
}

export function PersonPoster({ poster, name, className = '', fit = 'contain', layout = 'portrait' }: PersonPosterProps) {
  const [failed, setFailed] = useState(false)
  const { t } = useTranslation()
  return (
    <div data-person-poster className={`relative aspect-[4/5] shrink-0 overflow-hidden bg-canvas ${className}`}>
      {failed ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center" role="img" aria-label={`${name}: ${t('ui.imageFallback')}`}>
          <span className="font-display text-5xl text-gold" aria-hidden="true">{name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span>
          <span className="text-sm text-muted">{name}</span>
        </div>
      ) : (
        // Изображение не участвует в расчёте высоты: разные исходники не меняют формат блока.
        <img src={posterUrl(poster)} alt={name} width="800" height="1000" loading="lazy" decoding="async" onError={() => setFailed(true)} className={`${layout === 'speaker' ? 'absolute inset-y-0 left-0 h-full w-auto min-w-full object-cover object-left-top' : `absolute inset-0 h-full w-full ${fit === 'cover' ? 'object-cover object-top' : 'object-contain'}`} transition-transform duration-700 motion-safe:group-hover:scale-[1.025]`} />
      )}
    </div>
  )
}
