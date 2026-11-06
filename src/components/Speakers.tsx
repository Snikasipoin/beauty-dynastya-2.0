import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { speakers } from '../data/speakers'
import { useScrollAnimations } from '../hooks/useScrollAnimations'
import { ScrollTrigger } from '../lib/gsap'
import { Section } from './ui/Section'
import { PersonPoster } from './ui/PersonPoster'
import { SocialLinks } from './ui/SocialLinks'

export function Speakers() {
  const { t, i18n } = useTranslation()
  const scope = useRef<HTMLUListElement>(null)
  useScrollAnimations(scope, [i18n.language])
  return (
    <Section id="speakers" title={t('speakers.title')} description={t('ui.speakersHint')} className="bg-panel">
      <ul ref={scope} className="space-y-8">
        {speakers.map((speaker) => {
          const prefix = `speakers.people.${speaker.id}`
          return (
            <li key={speaker.id} data-card className="group grid overflow-hidden rounded-2xl bg-canvas lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
              <PersonPoster poster={speaker.poster} name={speaker.name} layout="speaker" className="self-stretch" />
              <div className="flex min-w-0 flex-col justify-center p-6 sm:p-10 lg:p-14">
                <h3 className="font-display text-3xl leading-tight font-bold sm:text-4xl">{speaker.name}</h3>
                <p className="mt-3 text-sm font-semibold text-gold">{t(`${prefix}.label`)} · {t(`${prefix}.country`)}</p>
                <p className="mt-6 max-w-prose leading-relaxed text-muted">{t(`${prefix}.bio`)}</p>
                <details className="my-5 border-y border-line" onToggle={() => ScrollTrigger.refresh()}>
                  <summary className="min-h-12 cursor-pointer py-3 text-sm font-semibold">{t('ui.details')}</summary>
                  <dl className="space-y-5 pb-6">{speaker.factIds.map((factId) => <div key={factId}><dt className="text-sm font-semibold text-cream">{t(`${prefix}.facts.${factId}.label`)}</dt><dd className="mt-1 text-sm leading-relaxed text-muted">{t(`${prefix}.facts.${factId}.value`)}</dd></div>)}</dl>
                </details>
                <SocialLinks links={speaker.links} name={speaker.name} />
              </div>
            </li>
          )
        })}
      </ul>
    </Section>
  )
}
