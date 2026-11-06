import { useTranslation } from 'react-i18next'
import { partners } from '../data/partners'
import { Section } from './ui/Section'
import { PersonPoster } from './ui/PersonPoster'
import { SocialLinks } from './ui/SocialLinks'

export function Partners() {
  const { t } = useTranslation()
  return (
    <Section id="partners" title={t('partners.title')}>
      {partners.map((partner) => (
        <article key={partner.id} className="group grid items-center gap-8 rounded-2xl bg-panel p-6 sm:p-10 md:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] md:gap-14">
          <PersonPoster poster={partner.poster} name={partner.name} className="mx-auto w-full max-w-sm rounded-xl" />
          <div className="min-w-0"><h3 className="font-display text-4xl font-bold sm:text-5xl">{partner.name}</h3><p className="mt-3 text-sm font-semibold text-gold">{t(`partners.people.${partner.id}.label`)}</p><p className="mt-6 mb-7 max-w-prose leading-relaxed text-muted">{t(`partners.people.${partner.id}.bio`)}</p><SocialLinks links={partner.links} name={partner.name} /></div>
        </article>
      ))}
    </Section>
  )
}
