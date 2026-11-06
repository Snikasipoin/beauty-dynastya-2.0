import { ArrowDown, ArrowUpRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { logo } from '../lib/assets'

export function Hero() {
  const { t } = useTranslation()
  return (
    <section className="hero-surface relative isolate overflow-hidden" aria-labelledby="hero-title">
      <div className="container-shell grid min-h-[min(760px,90svh)] items-center gap-8 py-14 md:grid-cols-[1.1fr_1fr] md:py-20">
        <div className="relative z-10">
          <h1 id="hero-title" className="max-w-6xl font-display text-[clamp(3.5rem,7vw,6rem)] leading-[0.98] font-bold tracking-[-0.04em]">Beauty<br /><span className="text-gold">Dynastya</span></h1>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">{t('hero.subtitle')}</p>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted">{t('hero.nominations')}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a href="#register" className="btn-primary">{t('hero.register')}<ArrowUpRight className="size-4 shrink-0" aria-hidden="true" /></a>
            <a href="#judges" className="btn-secondary">{t('hero.judges')}</a>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-lg md:max-w-none">
          <img src={logo} alt="Beauty Dynastya" width="900" height="623" fetchPriority="high" className="relative h-auto w-full" />
        </div>
      </div>
      <div className="container-shell flex flex-wrap items-center justify-between gap-4 border-t border-line py-6">
        <p className="font-display text-xl font-bold text-gold tabular-nums">{t('hero.dates')}</p>
        <a href="#about" className="inline-flex min-h-11 items-center gap-3 text-sm text-muted hover:text-cream">{t('ui.heroExplore')}<ArrowDown className="size-4" aria-hidden="true" /></a>
      </div>
    </section>
  )
}
