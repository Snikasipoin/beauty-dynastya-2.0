// При изменении условий согласия обновляйте версию: она передаётся вместе с заявкой.
export const legalDocuments = {
  version: '2026-11-14',
  // Бренд не заменяет реквизиты оператора. Заполните их перед публикацией документов.
  operator: {
    name: '',
    country: '',
    address: '',
    email: '',
  } satisfies Record<'name' | 'country' | 'address' | 'email', string>,
  processorPrivacyUrl: 'https://web3forms.com/privacy',
  processorAgreementUrl: 'https://web3forms.com/dpa',
} as const

export type LegalDocument = 'consent' | 'privacy'

export const legalSectionIds = {
  consent: ['purpose', 'data', 'actions', 'processors', 'term', 'withdrawal', 'limits'],
  privacy: ['scope', 'data', 'purpose', 'processing', 'retention', 'rights', 'storage', 'external'],
} as const

export function legalDocumentHref(document: LegalDocument, language: string): string {
  // Относительная ссылка сохраняет подпапку GitHub Pages и работает в корне Timeweb.
  return `?lang=${encodeURIComponent(language)}#/${document}`
}
