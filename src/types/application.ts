export type ApplicationRole = 'judge' | 'participant' | 'speaker'

export interface ApplicationValues {
  fullName: string
  country: string
  role: ApplicationRole | ''
  botcheck: boolean
}

export type ApplicationErrors = Partial<Record<'fullName' | 'country' | 'role', 'required' | 'roleRequired'>>
export type SubmissionStatus = 'idle' | 'sending' | 'success' | 'error'
