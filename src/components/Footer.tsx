import { ArrowUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { championship } from '../data/championship'
import { logo } from '../lib/assets'

const currentYear = new Date().getFullYear()

export function Footer() {
  const { t } = useTranslation()
  return (
    <footer className="border-t border-line py-10">
      <div className="container-shell flex flex-wrap items-center justify-between gap-8">
        <div><a href="#top" className="inline-flex min-h-11 items-center gap-3"><img src={logo} alt="" width="900" height="623" className="h-auto w-14" /><span className="font-display text-xl font-bold">{championship.name}</span></a><p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">{t('ui.footerNote')}</p></div>
        <div className="flex flex-col gap-3 text-sm"><a className="inline-flex min-h-11 items-center text-gold hover:text-cream" href={championship.instagram} target="_blank" rel="noopener noreferrer">{championship.instagramHandle}</a><p className="text-muted">© {currentYear} {championship.name}</p></div>
        <a href="#top" className="btn-secondary"><ArrowUp className="size-4 shrink-0" aria-hidden="true" />{t('ui.backToTop')}</a>
      </div>
    </footer>
  )
}
