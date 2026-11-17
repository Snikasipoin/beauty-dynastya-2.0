import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Pause, Play } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { logo } from '../lib/assets'

const depths = Array.from({ length: 21 }, (_, index) => index * 0.9 - 9)
type LogoStyle = CSSProperties & { '--logo-image': string }

export function HeroLogo() {
  const { t } = useTranslation()
  const scene = useRef<HTMLDivElement>(null)
  const [paused, setPaused] = useState(false)
  const [visible, setVisible] = useState(false)
  const [pageVisible, setPageVisible] = useState(true)

  useEffect(() => {
    const root = scene.current
    if (!root) return
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting && entry.intersectionRatio >= 0.1)
    }, { threshold: [0, 0.1] })
    const updateVisibility = () => setPageVisible(!document.hidden)
    observer.observe(root)
    updateVisibility()
    document.addEventListener('visibilitychange', updateVisibility)
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', updateVisibility)
    }
  }, [])

  return (
    <div ref={scene} className="hero-logo-scene relative mx-auto w-full max-w-lg lg:max-w-[900px]" data-running={visible && pageVisible && !paused} style={{ '--logo-image': `url("${logo}")` } as LogoStyle}>
      <div className="hero-logo-rotor" role="img" aria-label="Beauty Dynastya">
        {/* Маска исходного PNG сохраняет прозрачный контур и отверстия логотипа. */}
        {depths.map(depth => <span key={depth} aria-hidden="true" className="hero-logo-edge" style={{ transform: `translateZ(${depth}px)` }} />)}
        <img src={logo} alt="" aria-hidden="true" width="900" height="623" fetchPriority="high" className="hero-logo-face hero-logo-front" />
        <img src={logo} alt="" aria-hidden="true" width="900" height="623" className="hero-logo-face hero-logo-back" />
      </div>
      <button type="button" className="hero-logo-control" onClick={() => setPaused(value => !value)} aria-label={t(paused ? 'hero.logoResume' : 'hero.logoPause')} title={t(paused ? 'hero.logoResume' : 'hero.logoPause')}>
        {paused ? <Play className="size-4" aria-hidden="true" /> : <Pause className="size-4" aria-hidden="true" />}
      </button>
    </div>
  )
}
