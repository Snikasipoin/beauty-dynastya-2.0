export const regulationLanguages = [
  { code: 'ru', name: 'Русский' },
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'fr', name: 'Français' },
  { code: 'it', name: 'Italiano' },
  { code: 'es', name: 'Español' },
  { code: 'pl', name: 'Polski' },
  { code: 'ro', name: 'Română' },
  { code: 'he', name: 'עברית' },
] as const

export type RegulationLanguage = typeof regulationLanguages[number]['code']
export const regulationCategoryLabels = { lash: 'Lash', nails: 'Nails', pmu: 'PMU' } as const
export type RegulationCategory = keyof typeof regulationCategoryLabels
export type RegulationKind = 'regulations' | 'checklist'

export interface RegulationDocument {
  id: string
  category: RegulationCategory
  kind: RegulationKind
  translations: Partial<Record<RegulationLanguage, string>>
}

export function isRegulationLanguage(value: string): value is RegulationLanguage {
  return regulationLanguages.some(({ code }) => code === value)
}

// Vite публикует исходные PDF с хэшами и учитывает base GitHub Pages.
// В JS попадают только URL: сами документы загружаются при открытии/скачивании.
const files = import.meta.glob<string>([
  '../../reglament/**/*.pdf',
  // Это точная копия польского чек-листа, ошибочно помещённая в папку DE.
  '!../../reglament/lash/DE/Beauty_Dynastya_LASH_Checklist_PL.pdf',
], { eager: true, query: '?url', import: 'default' })

const documents = new Map<string, RegulationDocument>()

for (const [path, url] of Object.entries(files)) {
  // Язык берём из имени PDF: названия папок разнородны и ненадёжны.
  const match = path.match(/\/Beauty_Dynastya_(LASH|NAILS)_(Regulations|Checklist)_([A-Z]{2})(?: \(\d+\))?\.pdf$/)
  const pmuMatch = path.match(/\/Beauty_Dynasty_PMU_2027_([A-Z]{2})\.pdf$/)
  // Русский оригинал PMU состоит из изображений и не содержит кода языка в имени.
  // Язык проверен по страницам PDF; исходное имя и содержимое сохраняем.
  const pmuRussian = path === '../../reglament/pmu/Beauty_Dynasty_PMU_2027_NEW_PHOTOS_10_POINTS.pdf'
  let category: RegulationCategory
  let kind: RegulationKind
  let language: string
  if (match) {
    category = match[1] === 'LASH' ? 'lash' : 'nails'
    kind = match[2] === 'Regulations' ? 'regulations' : 'checklist'
    language = match[3].toLowerCase()
  } else if (pmuMatch || pmuRussian) {
    category = 'pmu'
    kind = 'regulations'
    language = pmuMatch ? pmuMatch[1].toLowerCase() : 'ru'
  } else {
    throw new Error(`Unknown regulation filename: ${path}`)
  }
  if (!isRegulationLanguage(language)) throw new Error(`Unknown regulation language: ${path}`)
  const id = `${category}-${kind}`
  const document: RegulationDocument = documents.get(id) ?? { id, category, kind, translations: {} }
  if (document.translations[language]) throw new Error(`Duplicate regulation translation: ${path}`)
  document.translations[language] = url
  documents.set(id, document)
}

export const regulations: readonly RegulationDocument[] = [...documents.values()].sort((a, b) => (
  a.category.localeCompare(b.category) || Number(a.kind === 'checklist') - Number(b.kind === 'checklist')
))
