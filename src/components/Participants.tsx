import { useTranslation } from 'react-i18next'
import { participants } from '../data/participants'
import { Section } from './ui/Section'
import { PersonPoster } from './ui/PersonPoster'
import { SocialLinks } from './ui/SocialLinks'

export function Participants() {
  const { t } = useTranslation()
  return (
    <Section id="participants" title={t('participants.title')}>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {participants.map((person) => {
          const prefix = `participants.people.${person.id}`
          const country = t(`${prefix}.country`)
          const bio = t(`${prefix}.bio`, { defaultValue: '' })
          return (
            <li key={person.id} className="group min-w-0 overflow-hidden rounded-2xl bg-panel">
              <PersonPoster poster={person.poster} name={person.name} />
              <div className="p-6">
                <h3 className="font-display text-2xl font-bold">{person.name}</h3>
                {country && <p className="mt-2 text-sm text-muted">{country}</p>}
                {bio && <p className="mt-3 text-sm leading-relaxed text-muted">{bio}</p>}
                <div className="mt-4"><SocialLinks links={person.links} name={person.name} /></div>
              </div>
            </li>
          )
        })}
      </ul>
    </Section>
  )
}
