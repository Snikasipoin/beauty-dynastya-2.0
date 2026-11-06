import { ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { SocialLink } from '../../types/championship'

export function SocialLinks({ links, name }: { links: readonly SocialLink[]; name: string }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1">
      {links.map((link) => (
        <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" aria-label={`${t('ui.profile')}: ${name} (${link.label})`} className="inline-flex min-h-11 min-w-0 items-center gap-2 text-sm text-gold transition-colors hover:text-cream">
          <ExternalLink className="size-4 shrink-0" aria-hidden="true" />
          <span className="break-anywhere">{link.label}</span>
        </a>
      ))}
    </div>
  )
}
