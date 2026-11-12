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
export type RegulationCategory = 'lash' | 'nails'
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
  if (!match) throw new Error(`Unknown regulation filename: ${path}`)
  const category = match[1] === 'LASH' ? 'lash' : 'nails'
  const kind = match[2] === 'Regulations' ? 'regulations' : 'checklist'
  const language = match[3].toLowerCase()
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
