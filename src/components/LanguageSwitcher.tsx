import { useTranslation } from 'react-i18next'
import { changeLanguage, languages } from '../i18n'

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation()
  return (
    <div className="flex shrink-0 gap-0.5" role="group" aria-label={t('ui.language')}>
      {languages.map((language) => (
        <button key={language} type="button" lang={language} aria-pressed={i18n.language === language} onClick={() => { void changeLanguage(language) }} className={`min-h-11 min-w-11 rounded-lg px-2 text-xs font-bold uppercase tracking-wide transition-colors ${i18n.language === language ? 'bg-cream text-ink' : 'text-muted hover:bg-panel hover:text-cream'}`}>
          {language.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
