import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollTrigger } from './lib/gsap'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { About } from './components/About'
import { Nominations } from './components/Nominations'
import { HowItWorks } from './components/HowItWorks'
import { Judges } from './components/Judges'
import { Speakers } from './components/Speakers'
import { Participants } from './components/Participants'
import { Partners } from './components/Partners'
import { ApplicationForm } from './components/ApplicationForm'
import { Footer } from './components/Footer'
import { Regulations } from './components/Regulations'
import { Conference } from './components/Conference'
import { ConferenceTeaser } from './components/ConferenceTeaser'
import { LegalPage } from './components/LegalPage'
import { pageFromHash } from './lib/routes'

export default function App() {
  const { t, i18n } = useTranslation()
  const [page, setPage] = useState(() => pageFromHash(window.location.hash))
  const previousPage = useRef(page)
  useEffect(() => {
    const updatePage = () => setPage(pageFromHash(window.location.hash))
    window.addEventListener('hashchange', updatePage)
    return () => window.removeEventListener('hashchange', updatePage)
  }, [])
  useEffect(() => {
    const legalPage = page === 'consent' || page === 'privacy'
    document.title = legalPage ? `${t(`legal.${page}.title`)} — Beauty Dynastya` : page === 'conference' ? t('conference.metaTitle') : page === 'regulations' ? `${t('nav.regulations')} — Beauty Dynastya` : t('meta.title')
    document.querySelector('meta[name="description"]')?.setAttribute('content', legalPage ? t(`legal.${page}.intro`) : page === 'conference' ? t('conference.metaDescription') : t('meta.description'))
    if (previousPage.current === page) return
    previousPage.current = page
    document.getElementById('main')?.focus({ preventScroll: true })
    // Главная уже смонтирована: ссылки на её разделы снова находят свои якоря.
    const target = page !== 'home' ? 'top' : window.location.hash.slice(1) || 'top'
    document.getElementById(target)?.scrollIntoView({ behavior: 'instant' })
  }, [page, t])
  useEffect(() => {
    let active = true
    // Локальные шрифты и новый перевод могут изменить геометрию секций.
    void document.fonts.ready.then(() => { if (active) ScrollTrigger.refresh() })
    const frame = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => { active = false; cancelAnimationFrame(frame) }
  }, [i18n.language, page])

  return (
    <div id="top">
      <a href="#main" className="skip-link" onClick={(event) => {
        event.preventDefault()
        document.getElementById('main')?.focus()
      }}>{t('ui.skip')}</a>
      <Header page={page} />
      <main id="main" tabIndex={-1} className="w-full max-w-full">
        {page === 'consent' || page === 'privacy' ? <LegalPage document={page} /> : page === 'conference' ? <Conference /> : page === 'regulations' ? <Regulations /> : <><Hero /><ConferenceTeaser /><About /><Nominations /><HowItWorks /><Judges /><Speakers /><Participants /><Partners /><ApplicationForm /></>}
      </main>
      <Footer page={page} />
    </div>
  )
}
