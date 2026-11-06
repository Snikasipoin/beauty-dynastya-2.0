import { useTranslation } from 'react-i18next'
import { nominationIds } from '../data/championship'
import { Section } from './ui/Section'

export function Nominations() {
  const { t } = useTranslation()
  return (
    <Section id="nominations" title={t('nominations.title')}>
      <ul className="nomination-list">
        {nominationIds.map((id) => (
          <li key={id}>
            <a href="#register" className="nomination-link" data-nomination={id}>
              <h3 className="nomination-title font-display">{t(`nominations.items.${id}.title`)}</h3>
              <p className="nomination-description">{t(`nominations.items.${id}.description`)}</p>
            </a>
          </li>
        ))}
      </ul>
    </Section>
  )
}
