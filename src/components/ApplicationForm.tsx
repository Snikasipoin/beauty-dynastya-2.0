import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowUpRight, Check, LoaderCircle, Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { championship } from '../data/championship'
import { legalDocumentHref } from '../data/legal'
import { SubmissionError, submitApplication, validateApplication } from '../services/applications'
import type { ApplicationErrors, ApplicationRole, ApplicationValues, SubmissionStatus } from '../types/application'

const roles: readonly ApplicationRole[] = ['judge', 'participant', 'speaker']
const emptyValues: ApplicationValues = { fullName: '', country: '', role: '', botcheck: false, consent: false }

export function ApplicationForm() {
  const { t, i18n } = useTranslation()
  const [values, setValues] = useState<ApplicationValues>(emptyValues)
  const [errors, setErrors] = useState<ApplicationErrors>({})
  const [status, setStatus] = useState<SubmissionStatus>('idle')
  const [failure, setFailure] = useState<'error' | 'unavailable'>('error')
  const sending = useRef(false)
  const submission = useRef<{ id: string; consentGivenAt: string; language: string } | null>(null)
  const controller = useRef<AbortController | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const successHeading = useRef<HTMLHeadingElement>(null)

  useEffect(() => () => controller.current?.abort(), [])
  useEffect(() => { if (status === 'success') successHeading.current?.focus() }, [status])

  function update<K extends keyof ApplicationValues>(key: K, value: ApplicationValues[K]) {
    const next = { ...values, [key]: value }
    setValues(next)
    submission.current = null
    // Ошибки хранятся ключами: язык можно менять и после неудачной валидации.
    if (Object.keys(errors).length) setErrors(validateApplication(next))
    if (status === 'error') setStatus('idle')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (sending.current) return
    const nextErrors = validateApplication(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      const firstInvalid = (['fullName', 'country', 'role', 'consent'] as const).find((field) => nextErrors[field])
      if (firstInvalid) formRef.current?.querySelector<HTMLInputElement>(`[data-field="${firstInvalid}"]`)?.focus()
      return
    }
    if (values.botcheck) { setFailure('error'); setStatus('error'); return }
    const request = new AbortController()
    controller.current = request
    sending.current = true
    setStatus('sending')
    const timeout = window.setTimeout(() => request.abort(), 15000)
    try {
      // Повтор неизменённой заявки использует прежний номер, чтобы избежать дублей.
      if (!submission.current || submission.current.language !== i18n.language) {
        submission.current = { id: crypto.randomUUID(), consentGivenAt: new Date().toISOString(), language: i18n.language }
      }
      await submitApplication(values, i18n.language, request.signal, submission.current.id, submission.current.consentGivenAt)
      submission.current = null
      setStatus('success')
      setValues(emptyValues)
    } catch (error) {
      setFailure(error instanceof SubmissionError && error.unavailable ? 'unavailable' : 'error')
      setStatus('error')
    } finally {
      window.clearTimeout(timeout)
      sending.current = false
      controller.current = null
    }
  }

  return (
    <section id="register" className="section-space registration-surface" aria-labelledby="register-title">
      <div className="container-shell grid items-start gap-12 lg:grid-cols-2 lg:gap-24">
        <div>
          <h2 id="register-title" className="section-title">{t('registration.title')}</h2>
          <p className="mt-7 max-w-prose text-lg leading-relaxed text-muted">{t('registration.text')}</p>
          <p className="mt-5 max-w-prose leading-relaxed text-gold">{t('registration.note')}</p>
          <div className="mt-8 flex flex-wrap gap-3"><a href={championship.telegram} target="_blank" rel="noopener noreferrer" className="btn-primary"><Send className="size-4 shrink-0" aria-hidden="true" />{t('registration.telegram')}</a><a href={championship.instagramMessage} target="_blank" rel="noopener noreferrer" className="btn-secondary">{t('registration.instagram')}<ArrowUpRight className="size-4 shrink-0" aria-hidden="true" /></a></div>
          <p className="mt-7 max-w-md text-sm leading-relaxed text-muted">{t('ui.telegramHint')}</p>
        </div>
        <div className="min-w-0 rounded-2xl bg-panel p-6 sm:p-9">
          {status === 'success' ? (
            <div className="py-8" role="status">
              <Check className="mb-6 size-12 text-gold" aria-hidden="true" />
              <h3 ref={successHeading} tabIndex={-1} className="font-display text-3xl font-bold">{t('form.success')}</h3>
              <p className="mt-5 leading-relaxed text-muted">{t('form.successText')}</p>
              <a href={championship.telegram} target="_blank" rel="noopener noreferrer" className="btn-primary mt-7">{t('registration.telegram')}</a>
              <button type="button" className="mt-5 block min-h-11 text-sm text-muted underline underline-offset-4" onClick={() => setStatus('idle')}>{t('ui.successClose')}</button>
            </div>
          ) : (
            <form ref={formRef} noValidate onSubmit={(event) => { void handleSubmit(event) }} aria-labelledby="application-title" aria-busy={status === 'sending'}>
              <h3 id="application-title" className="font-display text-2xl font-bold sm:text-3xl">{t('form.title')}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{t('form.lead')} {t('ui.requiredNote')}</p>
              <fieldset disabled={status === 'sending'} className="mt-7 space-y-6 disabled:opacity-70">
                <legend className="sr-only">{t('ui.applicationForm')}</legend>
                <div><label htmlFor="application-name" className="field-label">{t('form.name')}</label><input id="application-name" name="full_name" data-field="fullName" type="text" autoComplete="name" maxLength={120} required value={values.fullName} onChange={(event) => update('fullName', event.target.value)} placeholder={t('ui.namePlaceholder')} aria-invalid={Boolean(errors.fullName)} aria-describedby="name-error" className="field-input" /><p id="name-error" className="field-error">{errors.fullName && t(`ui.${errors.fullName}`)}</p></div>
                <div><label htmlFor="application-country" className="field-label">{t('form.country')}</label><input id="application-country" name="country" data-field="country" type="text" autoComplete="country-name" maxLength={100} required value={values.country} onChange={(event) => update('country', event.target.value)} placeholder={t('ui.countryPlaceholder')} aria-invalid={Boolean(errors.country)} aria-describedby="country-error" className="field-input" /><p id="country-error" className="field-error">{errors.country && t(`ui.${errors.country}`)}</p></div>
                <fieldset aria-describedby="role-error"><legend className="field-label">{t('form.role')}</legend><div className="flex flex-wrap gap-2">{roles.map((role) => <label key={role} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg bg-card px-4 py-3 text-sm has-checked:bg-cream has-checked:text-ink"><input type="radio" name="role" data-field="role" value={role} checked={values.role === role} onChange={() => update('role', role)} required aria-invalid={Boolean(errors.role)} className="size-4 accent-accent" /><span>{t(`form.roles.${role}`)}</span></label>)}</div><p id="role-error" className="field-error">{errors.role && t(`ui.${errors.role}`)}</p></fieldset>
                <div>
                  <div className="flex items-start gap-3">
                    <input id="application-consent" name="personal_data_consent" data-field="consent" type="checkbox" required checked={values.consent} onChange={(event) => update('consent', event.target.checked)} aria-invalid={Boolean(errors.consent)} aria-describedby="consent-error consent-help" className="mt-3 size-5 shrink-0 cursor-pointer accent-gold" />
                    <div className="min-w-0 text-sm leading-relaxed">
                      <label htmlFor="application-consent" className="flex min-h-11 cursor-pointer items-center">{t('legal.checkbox')}</label>
                      <a href={legalDocumentHref('consent', i18n.language)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-gold underline underline-offset-4 hover:text-cream">{t('legal.readConsent')}</a>
                    </div>
                  </div>
                  <p id="consent-error" className="field-error" aria-live="polite">{errors.consent && t(`ui.${errors.consent}`)}</p>
                  <p id="consent-help" className="mt-3 text-sm leading-relaxed text-muted">{t('legal.formHint')} <a href={legalDocumentHref('privacy', i18n.language)} target="_blank" rel="noopener noreferrer" className="text-gold underline underline-offset-4 hover:text-cream">{t('legal.privacy.title')}</a></p>
                </div>
                <div className="hidden" aria-hidden="true"><label htmlFor="application-botcheck">Website<input id="application-botcheck" name="botcheck" type="checkbox" tabIndex={-1} autoComplete="off" checked={values.botcheck} onChange={(event) => update('botcheck', event.target.checked)} /></label></div>
              </fieldset>
              <button type="submit" disabled={status === 'sending'} className="btn-primary mt-7 w-full">{status === 'sending' && <LoaderCircle className="size-4 shrink-0 motion-safe:animate-spin" aria-hidden="true" />}{t(status === 'sending' ? 'ui.sending' : 'form.submit')}</button>
              <p className="mt-4 text-sm leading-relaxed text-error" role="alert">{status === 'error' && t(`ui.${failure}`)}</p>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
