import { ArrowUpRight, CalendarDays } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { conference } from '../data/conference'
import heroImage from '../assets/images/conference/hero.webp'

export function ConferenceTeaser() {
  const { t } = useTranslation()
  return (
    <section id="conference-preview" className="conference-teaser" aria-labelledby="conference-preview-title">
      <div className="container-shell conference-teaser-layout">
        <div className="conference-teaser-copy">
          <h2 id="conference-preview-title">{t('conference.teaserTitle')}</h2>
          <div className="conference-teaser-details">
            <p className="conference-teaser-description">{t('conference.teaserDescription')}</p>
            <p className="conference-date"><CalendarDays className="size-5 shrink-0" aria-hidden="true" /><time dateTime={conference.startDate}>{t('conference.dates')}</time></p>
            <p className="conference-teaser-seats">{t('conference.freeSeats', { count: conference.freeSeats })}</p>
            <a href="#/conference" className="btn-primary conference-cta">{t('conference.teaserCta')}<ArrowUpRight className="size-5 shrink-0" aria-hidden="true" /></a>
          </div>
        </div>
        <div className="conference-teaser-media">
          <img src={heroImage} alt={t('conference.heroAlt')} width="1536" height="1024" loading="lazy" decoding="async" />
        </div>
      </div>
    </section>
  )
}
