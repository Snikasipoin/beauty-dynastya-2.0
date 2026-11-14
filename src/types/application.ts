import type { ContactError, ContactMethod } from '../lib/applicationContact'

export type ApplicationRole = 'judge' | 'participant' | 'speaker'

export interface ApplicationValues {
  fullName: string
  country: string
  role: ApplicationRole | ''
  contactMethod: ContactMethod | ''
  contactValue: string
  botcheck: boolean
  consent: boolean
}

export type ApplicationErrors = Partial<Record<'fullName' | 'country' | 'role' | 'contactMethod' | 'contactValue' | 'consent', 'required' | 'roleRequired' | 'consentRequired' | ContactError>>
export type SubmissionStatus = 'idle' | 'sending' | 'success' | 'error'
