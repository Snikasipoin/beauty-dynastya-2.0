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

export default function App() {
  const { t, i18n } = useTranslation()
  // Hash-маршрут работает на GitHub Pages без серверного SPA fallback.
  const [regulationsPage, setRegulationsPage] = useState(() => window.location.hash === '#/regulations')
  const previousPage = useRef(regulationsPage)
  useEffect(() => {
    const updatePage = () => setRegulationsPage(window.location.hash === '#/regulations')
    window.addEventListener('hashchange', updatePage)
    return () => window.removeEventListener('hashchange', updatePage)
  }, [])
  useEffect(() => {
    document.title = regulationsPage ? `${t('nav.regulations')} — Beauty Dynastya` : t('meta.title')
    if (previousPage.current === regulationsPage) return
    previousPage.current = regulationsPage
    document.getElementById('main')?.focus({ preventScroll: true })
    // Главная уже смонтирована: ссылки на её разделы снова находят свои якоря.
    const target = regulationsPage ? 'top' : window.location.hash.slice(1) || 'top'
    document.getElementById(target)?.scrollIntoView({ behavior: 'instant' })
  }, [regulationsPage, t])
  useEffect(() => {
    let active = true
    // Локальные шрифты и новый перевод могут изменить геометрию секций.
    void document.fonts.ready.then(() => { if (active) ScrollTrigger.refresh() })
    const frame = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => { active = false; cancelAnimationFrame(frame) }
  }, [i18n.language])

  return (
    <div id="top">
      <a href="#main" className="skip-link" onClick={(event) => {
        event.preventDefault()
        document.getElementById('main')?.focus()
      }}>{t('ui.skip')}</a>
      <Header regulationsPage={regulationsPage} />
      <main id="main" tabIndex={-1} className="w-full max-w-full">
        {regulationsPage ? <Regulations /> : <><Hero /><About /><Nominations /><HowItWorks /><Judges /><Speakers /><Participants /><Partners /><ApplicationForm /></>}
      </main>
      <Footer regulationsPage={regulationsPage} />
    </div>
  )
}
