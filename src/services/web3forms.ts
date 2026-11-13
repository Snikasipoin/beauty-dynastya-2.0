import type { ApplicationErrors, ApplicationValues } from '../types/application'
import { legalDocumentHref, legalDocuments } from '../data/legal'

export function validateApplication(values: ApplicationValues): ApplicationErrors {
  const errors: ApplicationErrors = {}
  if (!values.fullName.trim()) errors.fullName = 'required'
  if (!values.country.trim()) errors.country = 'required'
  if (!values.role) errors.role = 'roleRequired'
  if (values.consent !== true) errors.consent = 'consentRequired'
  return errors
}

export function hasWeb3FormsKey(): boolean {
  const key = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY?.trim()
  return Boolean(key && key !== 'YOUR_ACCESS_KEY')
}

// Ответ внешнего API проверяется как unknown, а не приводится к доверенному типу.
export async function submitApplication(values: ApplicationValues, language: string, signal: AbortSignal): Promise<void> {
  // Защита на границе сервиса: вызов в обход формы тоже не отправит данные без согласия.
  if (Object.keys(validateApplication(values)).length) throw new Error('Invalid application')
  const response = await fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      access_key: import.meta.env.VITE_WEB3FORMS_ACCESS_KEY,
      full_name: values.fullName.trim(),
      country: values.country.trim(),
      role: values.role,
      language,
      botcheck: values.botcheck,
      // Эти сведения придут вместе с заявкой; серверного журнала в статическом сайте нет.
      personal_data_consent: values.consent,
      consent_version: legalDocuments.version,
      consent_given_at: new Date().toISOString(),
      consent_document: new URL(legalDocumentHref('consent', language), window.location.href).href,
      privacy_policy: new URL(legalDocumentHref('privacy', language), window.location.href).href,
      subject: `Beauty Dynastya — ${values.role} (${language.toUpperCase()})`,
      from_name: 'Beauty Dynastya website',
    }),
  })
  const result: unknown = await response.json()
  if (!response.ok || typeof result !== 'object' || result === null || !('success' in result) || result.success !== true) {
    throw new Error('Application submission failed')
  }
}
