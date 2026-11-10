export type JudgeCategory = 'lash' | 'pmu' | 'brows' | 'lamination' | 'nails' | 'hair' | 'makeup'
export type JudgeFilter = JudgeCategory | 'all'
export type NominationId = 'nails' | 'lash' | 'pmu' | 'smp' | 'brows' | 'hair'
export type CountryCode = 'BG' | 'BY' | 'CH' | 'CU' | 'CV' | 'DE' | 'DK' | 'ES' | 'FR' | 'GB' | 'GR' | 'IL' | 'IT' | 'LT' | 'LV' | 'NL' | 'PL' | 'RO' | 'SK' | 'UA' | 'US'

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
  readonly secondaryAssignment?: {
    readonly category: JudgeCategory
    readonly poster: string
  }
}

export interface Speaker extends Person {
  readonly factIds: readonly string[]
}

export type Participant = Person
export type Partner = Person
