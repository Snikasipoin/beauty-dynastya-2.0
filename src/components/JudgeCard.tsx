import { useTranslation } from 'react-i18next'
import type { Judge } from '../types/championship'
import { PersonPoster } from './ui/PersonPoster'
import { SocialLinks } from './ui/SocialLinks'

export function JudgeCard({ judge }: { judge: Judge }) {
  const { t } = useTranslation()
  const prefix = `judges.people.${judge.id}`
  const bio = t(`${prefix}.bio`)
  return (
    <li data-card data-judge-id={judge.id} data-category={judge.category} className="group flex min-w-0 flex-col overflow-hidden rounded-2xl bg-panel transition-shadow duration-300 hover:shadow-[0_14px_36px_-16px_rgba(0,0,0,0.7)]">
      <PersonPoster poster={judge.poster} name={judge.name} />
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="font-display text-xl leading-snug font-bold break-words">{judge.name}</h3>
        <p className="mt-2 text-sm font-medium text-gold">{t(`${prefix}.country`)}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">{t(`${prefix}.role`)}</p>
        {bio && <p className="mt-4 text-sm leading-relaxed text-muted">{bio}</p>}
        <div className="mt-auto pt-4"><SocialLinks links={judge.links} name={judge.name} /></div>
      </div>
    </li>
  )
}
