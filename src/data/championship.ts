import type { JudgeFilter, NominationId } from '../types/championship'
import { judges } from './judges'

// Номинации чемпионата и специализации судей — разные справочники.
export const nominationIds = ['nails', 'lash', 'pmu', 'smp', 'brows', 'hair'] as const satisfies readonly NominationId[]
export const judgeFilters = ['all', 'lash', 'pmu', 'brows', 'lamination', 'nails', 'hair'] as const satisfies readonly JudgeFilter[]
export const processIds = ['registration', 'preparation', 'submission', 'evaluation', 'results', 'awards'] as const
export const navigationIds = ['about', 'nominations', 'judges', 'speakers', 'participants', 'partners'] as const

export const championship = {
  name: 'Beauty Dynastya',
  telegram: 'https://t.me/Beautydynastya',
  instagram: 'https://www.instagram.com/beauty_dynastya/',
  instagramHandle: '@beauty_dynastya',
  instagramMessage: 'https://ig.me/m/beauty_dynastya',
  judgeCount: judges.length,
  countryCount: new Set(judges.flatMap((judge) => [...judge.countryCodes])).size,
  nominationCount: nominationIds.length,
} as const
