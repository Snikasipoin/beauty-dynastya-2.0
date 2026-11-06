import { ArrowUpRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { nominationIds } from '../data/championship'
import { Section } from './ui/Section'

export function Nominations() {
  const { t } = useTranslation()
  return (
    <Section id="nominations" title={t('nominations.title')}>
      <ul className="grid gap-x-10 md:grid-cols-2 lg:grid-cols-3">
        {nominationIds.map((id) => (
          <li key={id} className="border-t border-line py-7">
            <a href="#register" className="group block min-h-11">
              <div className="flex items-center justify-between gap-5"><h3 className="font-display text-2xl font-bold">{t(`nominations.items.${id}.title`)}</h3><ArrowUpRight className="size-5 shrink-0 text-gold transition-transform motion-safe:group-hover:translate-x-1 motion-safe:group-hover:-translate-y-1" aria-hidden="true" /></div>
              <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">{t(`nominations.items.${id}.description`)}</p>
            </a>
          </li>
        ))}
      </ul>
    </Section>
  )
}
