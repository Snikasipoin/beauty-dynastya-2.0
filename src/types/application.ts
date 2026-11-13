export type ApplicationRole = 'judge' | 'participant' | 'speaker'

export interface ApplicationValues {
  fullName: string
  country: string
  role: ApplicationRole | ''
  botcheck: boolean
  consent: boolean
}

export type ApplicationErrors = Partial<Record<'fullName' | 'country' | 'role' | 'consent', 'required' | 'roleRequired' | 'consentRequired'>>
export type SubmissionStatus = 'idle' | 'sending' | 'success' | 'error'
