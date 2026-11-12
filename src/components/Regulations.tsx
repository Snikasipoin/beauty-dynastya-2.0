import { useState } from 'react'
import { ArrowLeft, ArrowUpRight, Download, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { isRegulationLanguage, regulationLanguages, regulations } from '../data/regulations'
import type { RegulationCategory, RegulationLanguage } from '../data/regulations'

const categories = ['all', 'lash', 'nails'] as const

export function Regulations() {
  const { t, i18n } = useTranslation()
  const [category, setCategory] = useState<'all' | RegulationCategory>('all')
  const [manualLanguage, setManualLanguage] = useState<RegulationLanguage | null>(null)
  const [query, setQuery] = useState('')
  const siteLanguage = i18n.language.split('-')[0]
  const language = manualLanguage ?? (isRegulationLanguage(siteLanguage) ? siteLanguage : 'en')
  const search = query.trim().normalize('NFKC').toLocaleLowerCase(i18n.language)
  const visibleDocuments = regulations.filter((document) => {
    const text = `${document.category} ${t(`regulations.documents.${document.id}.title`)} ${t(`regulations.documents.${document.id}.description`)}`
    return (category === 'all' || category === document.category) && text.normalize('NFKC').toLocaleLowerCase(i18n.language).includes(search)
  })

  return (
    <section className="py-10 sm:py-14 lg:py-16" aria-labelledby="regulations-title">
      <div className="container-shell">
        <a href="#top" className="mb-8 inline-flex min-h-11 items-center gap-2 text-sm text-muted transition-colors hover:text-cream">
          <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />{t('regulations.back')}
        </a>
        <h1 id="regulations-title" className="section-title">{t('nav.regulations')}</h1>
        <p className="mt-5 max-w-2xl leading-relaxed text-muted">{t('regulations.description')}</p>

        <div className="mt-10 border-y border-line py-6 md:mt-12">
          <div className="grid items-end gap-6 md:grid-cols-2 xl:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)]">
            <div>
              <p id="regulation-category-label" className="field-label">{t('regulations.category')}</p>
              <div className="flex flex-wrap gap-2" role="group" aria-labelledby="regulation-category-label">
                {categories.map((value) => (
                  <button key={value} type="button" aria-pressed={category === value} onClick={() => setCategory(value)} className={`min-h-11 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${category === value ? 'bg-cream text-ink' : 'bg-panel text-muted hover:bg-card hover:text-cream'}`}>
                    {value === 'all' ? t('regulations.all') : value === 'lash' ? 'Lash' : 'Nails'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="regulation-language" className="field-label">{t('regulations.language')}</label>
              <select id="regulation-language" value={manualLanguage ?? 'auto'} onChange={(event) => {
                const value = event.target.value
                setManualLanguage(isRegulationLanguage(value) ? value : null)
              }} className="field-input">
                <option value="auto">{t('regulations.autoLanguage', { language: siteLanguage.toUpperCase() })}</option>
                {regulationLanguages.map(({ code, name }) => <option key={code} value={code} lang={code}>{code.toUpperCase()} — {name}</option>)}
              </select>
            </div>
            <div className="md:col-span-2 xl:col-span-1">
              <label htmlFor="regulation-search" className="field-label">{t('regulations.search')}</label>
              <div className="relative">
                <Search className="pointer-events-none absolute top-4 left-4 size-5 text-muted" aria-hidden="true" />
                <input id="regulation-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('regulations.searchPlaceholder')} className="field-input pl-12" />
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted">{t('regulations.languageHint')}</p>
        </div>

        <p className="my-6 text-sm text-muted tabular-nums" role="status">{t('regulations.results', { count: visibleDocuments.length })}</p>
        {visibleDocuments.length > 0 ? (
          <ul className="grid gap-5 lg:grid-cols-2">
            {visibleDocuments.map((document) => {
              const title = t(`regulations.documents.${document.id}.title`)
              const url = document.translations[language]
              return (
                <li key={document.id} data-regulation-id={document.id} className="flex min-w-0 flex-col rounded-2xl bg-panel p-6 sm:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-gold">{document.category === 'lash' ? 'Lash' : 'Nails'}</span>
                    <span className="text-muted">PDF{url && ` · ${language.toUpperCase()}`}</span>
                  </div>
                  <h2 className="mt-5 font-display text-2xl leading-snug font-bold sm:text-3xl">{title}</h2>
                  <p className="mt-3 max-w-prose leading-relaxed text-muted">{t(`regulations.documents.${document.id}.description`)}</p>
                  <p className="mt-5 text-sm leading-relaxed text-muted">{t('regulations.availableLanguages')} {regulationLanguages.filter(({ code }) => document.translations[code]).map(({ code }) => code.toUpperCase()).join(' · ')}</p>
                  <div className="mt-auto pt-6">
                    {url ? (
                      <div className="flex flex-wrap gap-3">
                        <a href={url} target="_blank" rel="noopener noreferrer" hrefLang={language} className="btn-primary" aria-label={t('regulations.openLabel', { title, language: language.toUpperCase() })}>
                          {t('regulations.open')}<ArrowUpRight className="size-4 shrink-0" aria-hidden="true" />
                        </a>
                        <a href={url} download={`Beauty_Dynastya_${document.category.toUpperCase()}_${document.kind}_${language.toUpperCase()}.pdf`} hrefLang={language} className="btn-secondary" aria-label={t('regulations.downloadLabel', { title, language: language.toUpperCase() })}>
                          <Download className="size-4 shrink-0" aria-hidden="true" />{t('regulations.download')}
                        </a>
                      </div>
                    ) : <p className="text-sm leading-relaxed text-gold">{t('regulations.unavailable', { language: language.toUpperCase() })}</p>}
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="py-10">
            <h2 className="font-display text-2xl font-bold">{t('regulations.empty')}</h2>
            <p className="mt-3 text-muted">{t('regulations.emptyHint')}</p>
            <button type="button" onClick={() => { setQuery(''); setCategory('all') }} className="btn-secondary mt-6">{t('regulations.reset')}</button>
          </div>
        )}
      </div>
    </section>
  )
}
