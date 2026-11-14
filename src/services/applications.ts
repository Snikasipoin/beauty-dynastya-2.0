import type { ApplicationErrors, ApplicationValues } from '../types/application'
import { legalDocumentHref, legalDocuments } from '../data/legal'
import { applicationApiUrl } from '../data/application'

export function validateApplication(values: ApplicationValues): ApplicationErrors {
  const errors: ApplicationErrors = {}
  if (!values.fullName.trim()) errors.fullName = 'required'
  if (!values.country.trim()) errors.country = 'required'
  if (!['participant', 'judge', 'speaker'].includes(values.role)) errors.role = 'roleRequired'
  if (values.consent !== true) errors.consent = 'consentRequired'
  return errors
}

export class SubmissionError extends Error {
  unavailable: boolean
  constructor(unavailable = false) {
    super('Application submission failed')
    this.unavailable = unavailable
  }
}

export async function submitApplication(
  values: ApplicationValues,
  language: string,
  signal: AbortSignal,
  submissionId: string = crypto.randomUUID(),
  consentGivenAt = new Date().toISOString(),
): Promise<void> {
  if (Object.keys(validateApplication(values)).length || values.botcheck) throw new Error('Invalid application')
  // URL отдельного API публичный; токен Telegram остаётся на сервере.
  const endpoint = import.meta.env.VITE_APPLICATION_API_URL?.trim() || (import.meta.env.PROD ? applicationApiUrl : '/api/applications')
  const response = await fetch(endpoint, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      full_name: values.fullName.trim(),
      country: values.country.trim(),
      role: values.role,
      language,
      botcheck: values.botcheck,
      personal_data_consent: values.consent,
      consent_version: legalDocuments.version,
      consent_given_at: consentGivenAt,
      consent_document: new URL(legalDocumentHref('consent', language), window.location.href).href,
      privacy_policy: new URL(legalDocumentHref('privacy', language), window.location.href).href,
      submission_id: submissionId,
    }),
  })
  if (response.status === 404 || response.status === 503) throw new SubmissionError(true)
  const result: unknown = await response.json()
  if (!response.ok || typeof result !== 'object' || result === null || !('success' in result) || result.success !== true) throw new SubmissionError()
}
