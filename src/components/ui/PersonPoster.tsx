import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { posterUrl } from '../../lib/assets'

interface PersonPosterProps { poster: string; name: string; className?: string }

export function PersonPoster({ poster, name, className = '' }: PersonPosterProps) {
  const [failed, setFailed] = useState(false)
  const { t } = useTranslation()
  return (
    <div className={`relative aspect-[4/5] overflow-hidden bg-canvas ${className}`}>
      {failed ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center" role="img" aria-label={`${name}: ${t('ui.imageFallback')}`}>
          <span className="font-display text-5xl text-gold" aria-hidden="true">{name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span>
          <span className="text-sm text-muted">{name}</span>
        </div>
      ) : (
        <img src={posterUrl(poster)} alt={name} width="800" height="1000" loading="lazy" decoding="async" onError={() => setFailed(true)} className="h-full w-full object-contain transition-transform duration-700 motion-safe:group-hover:scale-[1.025]" />
      )}
    </div>
  )
}
