import { ArrowUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { championship } from '../data/championship'
import { legalDocumentHref } from '../data/legal'
import { logo } from '../lib/assets'
import type { PageRoute } from '../lib/routes'

const currentYear = new Date().getFullYear()

export function Footer({ page = 'home' }: { page?: PageRoute }) {
  const { t, i18n } = useTranslation()
  return (
    <footer className="border-t border-line py-10">
      <div className="container-shell flex flex-wrap items-center justify-between gap-8">
        <div><a href="#top" className="inline-flex min-h-11 items-center gap-3"><img src={logo} alt="" width="900" height="623" className="h-auto w-14" /><span className="font-display text-xl font-bold">{championship.name}</span></a><p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">{t('ui.footerNote')}</p></div>
        <div className="flex flex-col gap-3 text-sm"><a className="inline-flex min-h-11 items-center text-gold hover:text-cream" href={championship.instagram} target="_blank" rel="noopener noreferrer">{championship.instagramHandle}</a><p className="text-muted">© {currentYear} {championship.name}</p></div>
        <div className="flex flex-wrap items-center gap-5">
          <a href="#/regulations" className="inline-flex min-h-11 items-center text-sm text-muted transition-colors hover:text-cream" aria-current={page === 'regulations' ? 'page' : undefined}>{t('nav.regulations')}</a>
          <a href="#/conference" className="inline-flex min-h-11 items-center text-sm text-gold transition-colors hover:text-cream" aria-current={page === 'conference' ? 'page' : undefined}>{t('nav.conference')}</a>
          <a href={page === 'home' ? '#top' : `#/${page}`} onClick={() => { document.getElementById('top')?.scrollIntoView() }} className="btn-secondary"><ArrowUp className="size-4 shrink-0" aria-hidden="true" />{t('ui.backToTop')}</a>
        </div>
      </div>
      <nav aria-label={t('legal.navigation')} className="container-shell mt-8 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-6">
        {(['consent', 'privacy'] as const).map((document) => (
          <a key={document} href={legalDocumentHref(document, i18n.language)} aria-current={page === document ? 'page' : undefined} className="inline-flex min-h-11 items-center text-sm text-muted underline underline-offset-4 transition-colors hover:text-cream">{t(`legal.${document}.title`)}</a>
        ))}
      </nav>
    </footer>
  )
}
