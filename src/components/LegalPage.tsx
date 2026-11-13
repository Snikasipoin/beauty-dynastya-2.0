import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { championship } from '../data/championship'
import { legalDocumentHref, legalDocuments, legalSectionIds } from '../data/legal'
import type { LegalDocument } from '../data/legal'

export function LegalPage({ document }: { document: LegalDocument }) {
  const { t, i18n } = useTranslation()
  const relatedDocument = document === 'consent' ? 'privacy' : 'consent'
  const { operator } = legalDocuments
  const operatorIsIncomplete = Object.values(operator).some((value) => !value.trim())

  return (
    <article className="py-10 sm:py-14 lg:py-16" aria-labelledby="legal-title">
      <div className="container-shell">
        <a href="#register" className="mb-8 inline-flex min-h-11 items-center gap-2 text-sm text-muted transition-colors hover:text-cream">
          <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />{t('legal.back')}
        </a>
        <div className="max-w-[72ch]">
          <h1 id="legal-title" className="section-title">{t(`legal.${document}.title`)}</h1>
          <p className="mt-5 text-sm text-muted">{t('legal.version')} <time dateTime={legalDocuments.version}>{legalDocuments.version}</time></p>
          {operatorIsIncomplete && <p className="mt-5 leading-relaxed text-gold" data-legal-draft>{t('legal.draftNotice')}</p>}
          <p className="mt-6 leading-relaxed text-muted">{t(`legal.${document}.intro`)}</p>

          <section className="mt-10 border-y border-line py-6" aria-labelledby="legal-operator">
            <h2 id="legal-operator" className="font-display text-2xl font-bold">{t('legal.operatorTitle')}</h2>
            <p className="mt-4 leading-relaxed">{t('legal.organizer', { name: championship.name })}</p>
            <dl className="mt-5 space-y-4 text-sm leading-relaxed">
              {(['name', 'country', 'address', 'email'] as const).map((field) => (
                <div key={field}>
                  <dt className="font-semibold text-cream">{t(`legal.operatorFields.${field}`)}</dt>
                  <dd className="mt-1 break-anywhere text-muted">{field === 'email' && operator.email ? <a href={`mailto:${operator.email}`} className="text-gold underline underline-offset-4 hover:text-cream">{operator.email}</a> : operator[field] || t(`legal.operatorPlaceholders.${field}`)}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 leading-relaxed text-muted">{t('legal.contactHint')}</p>
            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
              <a href={championship.telegram} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 text-gold underline underline-offset-4 hover:text-cream">Telegram @Beautydynastya<ArrowUpRight className="size-4 shrink-0" aria-hidden="true" /></a>
            </div>
          </section>

          <div className="mt-10 space-y-10">
            {legalSectionIds[document].map((id) => (
              <section key={id} aria-labelledby={`legal-${id}`}>
                <h2 id={`legal-${id}`} className="font-display text-2xl leading-tight font-bold sm:text-3xl">{t(`legal.${document}.sections.${id}.title`)}</h2>
                <p className="mt-4 leading-relaxed text-muted">{t(`legal.${document}.sections.${id}.text`)}</p>
                {id === 'processors' || id === 'processing' ? (
                  <p className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                    <a href={legalDocuments.processorPrivacyUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-gold underline underline-offset-4 hover:text-cream">{t('legal.processorPrivacy')}</a>
                    <a href={legalDocuments.processorAgreementUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-gold underline underline-offset-4 hover:text-cream">{t('legal.processorAgreement')}</a>
                  </p>
                ) : null}
              </section>
            ))}
          </div>

          <div className="mt-12 border-t border-line pt-6">
            <a href={legalDocumentHref(relatedDocument, i18n.language)} className="inline-flex min-h-11 items-center gap-2 text-gold underline underline-offset-4 hover:text-cream">{t(`legal.${relatedDocument}.title`)}<ArrowUpRight className="size-4 shrink-0" aria-hidden="true" /></a>
            <p className="mt-4 text-sm leading-relaxed text-muted">{t('legal.separateDocuments')}</p>
          </div>
        </div>
      </div>
    </article>
  )
}
