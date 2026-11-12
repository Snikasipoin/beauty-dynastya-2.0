import { useEffect, useRef, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { championship, navigationIds } from '../data/championship'
import { logo } from '../lib/assets'
import { LanguageSwitcher } from './LanguageSwitcher'

export function Header({ regulationsPage = false }: { regulationsPage?: boolean }) {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); menuButton.current?.focus() }
    }
    const query = window.matchMedia('(min-width: 1440px)')
    const closeOnDesktop = () => { if (query.matches) setOpen(false) }
    document.addEventListener('keydown', closeOnEscape)
    query.addEventListener('change', closeOnDesktop)
    return () => { document.removeEventListener('keydown', closeOnEscape); query.removeEventListener('change', closeOnDesktop) }
  }, [open])

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/90 backdrop-blur-xl">
      <div className="container-shell flex min-h-22 flex-wrap items-center justify-between gap-x-3 gap-y-1 py-3">
        <a href="#top" className="flex min-h-11 items-center gap-2" onClick={() => setOpen(false)}>
          <img src={logo} alt="" width="900" height="623" className="h-auto w-12 sm:w-14" />
          <span className="font-display text-base font-bold sm:text-lg">{championship.name}</span>
        </a>
        <div className="order-3 flex w-full justify-center border-t border-line/50 pt-1 sm:order-2 sm:w-auto sm:border-0 sm:pt-0 min-[1440px]:order-3">
          <LanguageSwitcher />
        </div>
        <button ref={menuButton} type="button" aria-controls="main-navigation" aria-expanded={open} aria-label={t(open ? 'ui.closeMenu' : 'ui.menu')} className="order-2 grid size-11 place-items-center rounded-lg bg-panel min-[1440px]:hidden" onClick={() => setOpen(!open)}>
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
        <nav id="main-navigation" aria-label={t('ui.menu')} className={`${open ? 'flex' : 'hidden'} order-4 w-full flex-col gap-1 border-t border-line py-4 min-[1440px]:order-2 min-[1440px]:flex min-[1440px]:w-auto min-[1440px]:flex-row min-[1440px]:items-center min-[1440px]:gap-3 min-[1440px]:border-0 min-[1440px]:py-0`}>
          {navigationIds.map((id) => (
            <a key={id} href={`#${id}`} className="flex min-h-11 items-center rounded-lg px-2 text-sm text-muted transition-colors hover:text-cream" onClick={() => setOpen(false)}>{t(`nav.${id}`)}</a>
          ))}
          <a href="#/regulations" aria-current={regulationsPage ? 'page' : undefined} className={`flex min-h-11 items-center rounded-lg px-2 text-sm transition-colors hover:text-cream ${regulationsPage ? 'text-gold' : 'text-muted'}`} onClick={() => setOpen(false)}>{t('nav.regulations')}</a>
          <a href="#register" className="btn-primary mt-2 text-sm min-[1440px]:mt-0" onClick={() => setOpen(false)}>{t('nav.register')}</a>
        </nav>
      </div>
      {/* Язык меняется без пересоздания меню и без потери текущей позиции страницы. */}
      <span className="sr-only" aria-live="polite">{i18n.language.toUpperCase()}</span>
    </header>
  )
}
