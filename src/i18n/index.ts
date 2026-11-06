import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

export const languages = ['en', 'ru', 'it', 'de', 'fr'] as const
export type Language = typeof languages[number]

export function isLanguage(value: string | null | undefined): value is Language {
  return languages.some((language) => language === value)
}

const urlLanguage = new URL(window.location.href).searchParams.get('lang')
let savedLanguage: string | null = null
try { savedLanguage = localStorage.getItem('beauty-dynastya-language') } catch { /* Storage может быть запрещён браузером. */ }
const browserLanguage = navigator.language.split('-')[0]
const initialLanguage = [urlLanguage, savedLanguage, browserLanguage].find(isLanguage) ?? 'en'

const loaders = {
  en: () => import('../locales/en.json'),
  ru: () => import('../locales/ru.json'),
  it: () => import('../locales/it.json'),
  de: () => import('../locales/de.json'),
  fr: () => import('../locales/fr.json'),
}

// Посетитель получает выбранный перевод, остальные языки загружаются по запросу.
export const i18nReady = Promise.all([loaders.en(), loaders[initialLanguage]()]).then(async ([english, selected]) => {
  await i18n.use(initReactI18next).init({
    resources: { en: { translation: english.default }, [initialLanguage]: { translation: selected.default } },
    lng: initialLanguage,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  })
  syncLanguage(i18n.language)
})

let languageRequest = 0
export async function changeLanguage(language: Language): Promise<void> {
  const request = ++languageRequest
  if (!i18n.hasResourceBundle(language, 'translation')) {
    const resource = await loaders[language]()
    i18n.addResourceBundle(language, 'translation', resource.default)
  }
  // Быстрые последовательные клики не должны возвращать предыдущий язык.
  if (request === languageRequest) await i18n.changeLanguage(language)
}

function syncLanguage(language: string) {
  if (!isLanguage(language)) return
  document.documentElement.lang = language
  document.title = i18n.t('meta.title')
  document.querySelector('meta[name="description"]')?.setAttribute('content', i18n.t('meta.description'))
  try { localStorage.setItem('beauty-dynastya-language', language) } catch { /* Переключение работает и без сохранения. */ }
  const url = new URL(window.location.href)
  url.searchParams.set('lang', language)
  history.replaceState(history.state, '', url)
}

i18n.on('languageChanged', syncLanguage)

export default i18n
