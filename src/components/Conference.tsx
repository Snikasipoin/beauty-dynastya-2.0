import { ArrowLeft, ArrowUpRight, CalendarDays, Globe, Languages, Video } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { conference } from '../data/conference'
import heroImage from '../assets/images/conference/hero.webp'
import detailImage from '../assets/images/conference/detail.webp'

const benefits = [
  { id: 'online', icon: Globe },
  { id: 'translation', icon: Languages },
  { id: 'experts', icon: Video },
] as const

export function Conference() {
  const { t } = useTranslation()

  return (
    <>
      <section className="conference-hero" aria-labelledby="conference-title">
        <div className="container-shell">
          <a href="#top" className="conference-back"><ArrowLeft className="size-4" aria-hidden="true" />{t('conference.back')}</a>
          <div className="conference-hero-layout">
            <div className="conference-hero-copy">
              <h1 id="conference-title" className="conference-title">{t('conference.title')}</h1>
              <p className="conference-event-name">{conference.name}</p>
              <p className="conference-date"><CalendarDays className="size-5 shrink-0" aria-hidden="true" /><time dateTime={conference.startDate}>{t('conference.dates')}</time></p>
              <p className="conference-lead">{t('conference.invitation')}</p>
              <p className="conference-seats">{t('conference.freeSeats', { count: conference.freeSeats })}</p>
              <a href={conference.telegram} target="_blank" rel="noopener noreferrer" className="btn-primary conference-cta" data-conference-cta>
                {t('conference.cta')}<ArrowUpRight className="size-5 shrink-0" aria-hidden="true" />
              </a>
              <p className="mt-3 text-sm text-muted">{t('conference.telegramHint')}</p>
            </div>
            <div className="conference-hero-media">
              <img src={heroImage} alt={t('conference.heroAlt')} width="1536" height="1024" fetchPriority="high" className="conference-hero-image" />
              <div className="conference-image-caption"><span>{t('conference.imageCaption')}</span><span>01—15 / 12</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="conference-program section-space" aria-labelledby="conference-program-title">
        <div className="container-shell">
          <div className="conference-program-heading">
            <h2 id="conference-program-title" className="section-title">{t('conference.programTitle')}</h2>
            <p className="max-w-xl leading-relaxed text-muted">{t('conference.programDescription')}</p>
          </div>
          <dl className="conference-benefits">
            {benefits.map(({ id, icon: Icon }) => (
              <div key={id}>
                <dt><Icon className="size-6 shrink-0 text-gold" aria-hidden="true" /><span>{t(`conference.benefits.${id}.title`)}</span></dt>
                <dd>{t(`conference.benefits.${id}.description`)}</dd>
              </div>
            ))}
          </dl>
          <div className="conference-topics">
            <img src={detailImage} alt={t('conference.detailAlt')} width="1672" height="941" decoding="async" />
            <div>
              <h3 className="font-display text-3xl leading-tight font-bold sm:text-4xl">{t('conference.tracksTitle')}</h3>
              <p className="mt-5 max-w-prose leading-relaxed text-muted">{t('conference.tracksDescription')}</p>
              <ul className="conference-track-list" aria-label={t('conference.tracksTitle')}>
                {conference.tracks.map((track) => <li key={track}>{track}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="conference-light conference-registration" aria-labelledby="conference-registration-title">
        <div className="container-shell conference-registration-layout">
          <div>
            <h2 id="conference-registration-title" className="conference-offer"><span>{conference.freeSeats}</span>{t('conference.freeSeatsLabel')}</h2>
            <p className="conference-limited">{t('conference.limited')}</p>
          </div>
          <div>
            <p className="conference-registration-copy">{t('conference.closing')}</p>
            <a href={conference.telegram} target="_blank" rel="noopener noreferrer" className="btn-primary conference-cta-dark" data-conference-cta>
              {t('conference.cta')}<ArrowUpRight className="size-5 shrink-0" aria-hidden="true" />
            </a>
            <p className="mt-3 text-sm">{t('conference.telegramHint')}</p>
          </div>
        </div>
      </section>
    </>
  )
}
