import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { judges } from '../data/judges'
import { judgeFilters } from '../data/championship'
import type { JudgeFilter } from '../types/championship'
import { useScrollAnimations } from '../hooks/useScrollAnimations'
import { JudgeCard } from './JudgeCard'
import { Section } from './ui/Section'

export function Judges() {
  const { t, i18n } = useTranslation()
  const [filter, setFilter] = useState<JudgeFilter>('all')
  const scope = useRef<HTMLUListElement>(null)
  const visibleJudges = judges.filter((judge) => filter === 'all' || judge.category === filter)
  useScrollAnimations(scope, [filter, i18n.language])

  return (
    <Section id="judges" title={t('judges.title')} description={t('ui.judgesHint')}>
      <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label={t('judges.filterLabel')}>
        {judgeFilters.map((category) => (
          <button key={category} data-filter={category} type="button" aria-pressed={filter === category} onClick={() => setFilter(category)} className={`min-h-11 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${filter === category ? 'bg-cream text-ink' : 'bg-panel text-muted hover:bg-card hover:text-cream'}`}>
            {t(`judges.categories.${category}`)}
          </button>
        ))}
      </div>
      <p className="mb-8 text-sm text-muted tabular-nums" role="status" aria-live="polite">{t('ui.results', { count: visibleJudges.length })}</p>
      {visibleJudges.length === 0 && <p className="rounded-2xl bg-panel p-8">{t('ui.empty')}</p>}
      <ul ref={scope} className="grid items-start gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">{visibleJudges.map((judge) => <JudgeCard key={judge.id} judge={judge} />)}</ul>
    </Section>
  )
}
