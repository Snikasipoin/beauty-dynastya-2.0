// При изменении условий согласия обновляйте версию: она передаётся вместе с заявкой.
export const legalDocuments = {
    version: '2026-11-14.3',
    publishedOn: '2026-11-14',
    // Бренд не заменяет реквизиты оператора. Заполните их перед публикацией документов.
    operator: {
        name: '',
        country: '',
        address: '',
        email: '',
    },
    processorPrivacyUrl: 'https://telegram.org/privacy',
    hostingPrivacyUrl: 'https://bothost.ru/documents/privacy.pdf',
};
export const legalSectionIds = {
    consent: ['purpose', 'data', 'actions', 'processors', 'term', 'withdrawal', 'limits'],
    privacy: ['scope', 'data', 'purpose', 'processing', 'retention', 'rights', 'storage', 'external'],
};
export function legalDocumentHref(document, language) {
    // Относительная ссылка сохраняет подпапку GitHub Pages и работает в корне Timeweb.
    return `?lang=${encodeURIComponent(language)}#/${document}`;
}
