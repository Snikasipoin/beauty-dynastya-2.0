import { useEffect } from 'react'
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

export default function App() {
  const { t, i18n } = useTranslation()
  useEffect(() => {
    let active = true
    // Локальные шрифты и новый перевод могут изменить геометрию секций.
    void document.fonts.ready.then(() => { if (active) ScrollTrigger.refresh() })
    const frame = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => { active = false; cancelAnimationFrame(frame) }
  }, [i18n.language])

  return (
    <div id="top">
      <a href="#main" className="skip-link">{t('ui.skip')}</a>
      <Header />
      <main id="main" className="w-full max-w-full">
        <Hero /><About /><Nominations /><HowItWorks /><Judges /><Speakers /><Participants /><Partners /><ApplicationForm />
      </main>
      <Footer />
    </div>
  )
}
