import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { championship } from '../data/championship'
import { gsap, useGSAP } from '../lib/gsap'
import { Section } from './ui/Section'

export function About() {
  const { t, i18n } = useTranslation()
  const scope = useRef<HTMLParagraphElement>(null)
  useGSAP(() => {
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo('[data-word]', { opacity: 0.6 }, { opacity: 1, stagger: 0.06, ease: 'none', scrollTrigger: { trigger: scope.current, start: 'top 90%', end: 'bottom 55%', scrub: true } })
    })
    return () => media.revert()
  }, { scope, dependencies: [i18n.language], revertOnUpdate: true })

  return (
    <Section id="about" title={t('about.title')}>
      <div className="grid grid-flow-dense gap-4 md:grid-cols-12">
        <div className="rounded-2xl bg-panel p-7 sm:p-10 md:col-span-6">
          <p ref={scope} className="max-w-prose text-lg leading-relaxed sm:text-2xl">{t('about.text').split(' ').map((word, index) => <span key={`${i18n.language}-${index}`} data-word>{word} </span>)}</p>
          <p className="mt-8 inline-flex rounded-lg bg-card px-4 py-2 text-sm text-gold">{t('about.online')}</p>
        </div>
        <dl className="flex flex-col justify-between gap-10 rounded-2xl bg-card p-7 sm:p-10 md:col-span-3">
          <div><dt className="mb-3 text-sm text-muted">{t('about.facts.judges')}</dt><dd className="font-display text-6xl font-bold text-gold tabular-nums">{championship.judgeCount}</dd></div>
          <div><dt className="mb-3 text-sm text-muted">{t('about.facts.countries')}</dt><dd className="font-display text-4xl font-bold tabular-nums">{championship.countryCount}</dd></div>
        </dl>
        <dl className="flex flex-col justify-between gap-10 rounded-2xl bg-panel p-7 sm:p-10 md:col-span-3">
          <div><dt className="mb-3 text-sm text-muted">{t('about.facts.nominations')}</dt><dd className="font-display text-6xl font-bold tabular-nums">{championship.nominationCount}</dd></div>
          <div><dt className="mb-3 text-sm text-muted">{t('about.facts.format')}</dt><dd className="text-xl font-bold break-words">{t('about.online')}</dd></div>
        </dl>
      </div>
    </Section>
  )
}
