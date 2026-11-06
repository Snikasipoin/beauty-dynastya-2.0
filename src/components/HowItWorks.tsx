import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { processIds } from '../data/championship'
import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap'

export function HowItWorks() {
  const { t, i18n } = useTranslation()
  const scope = useRef<HTMLElement>(null)
  useGSAP(() => {
    const media = gsap.matchMedia()
    media.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
      ScrollTrigger.create({ trigger: scope.current, start: 'top 140px', end: 'bottom 75%', pin: '[data-process-heading]', pinSpacing: false, invalidateOnRefresh: true })
    })
    return () => media.revert()
  }, { scope, dependencies: [i18n.language], revertOnUpdate: true })

  return (
    <section ref={scope} id="how" className="section-space bg-panel" aria-labelledby="how-title">
      <div className="container-shell grid items-start gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-24">
        <div data-process-heading><h2 id="how-title" className="section-title">{t('process.title')}</h2><p className="mt-6 max-w-sm text-muted">{t('process.lead')}</p></div>
        <ol>
          {processIds.map((id, index) => (
            <li key={id} className="grid grid-cols-[2.5rem_1fr] gap-4 border-t border-line py-8 sm:gap-7">
              <span className="pt-1 font-display text-lg text-gold tabular-nums" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <div><h3 className="font-display text-2xl font-bold">{t(`process.steps.${id}.title`)}</h3><p className="mt-4 max-w-prose leading-relaxed text-muted">{t(`process.steps.${id}.description`)}</p></div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
