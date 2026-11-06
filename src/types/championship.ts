export type JudgeCategory = 'lash' | 'pmu' | 'brows' | 'lamination' | 'nails' | 'hair'
export type JudgeFilter = JudgeCategory | 'all'
export type NominationId = 'nails' | 'lash' | 'pmu' | 'smp' | 'brows' | 'hair'
export type CountryCode = 'BG' | 'ES' | 'CU' | 'DK' | 'FR' | 'DE' | 'GB' | 'LT' | 'IL' | 'IT' | 'LV' | 'PL' | 'RO' | 'SK' | 'CH' | 'US'

export interface SocialLink {
  readonly href: string
  readonly label: string
}

interface Person {
  readonly id: string
  readonly name: string
  readonly poster: string
  readonly links: readonly SocialLink[]
}

export interface Judge extends Person {
  readonly category: JudgeCategory
  readonly tier: 'vip' | 'standard'
  readonly countryCodes: readonly CountryCode[]
}

export interface Speaker extends Person {
  readonly factIds: readonly string[]
}

export type Participant = Person
export type Partner = Person
