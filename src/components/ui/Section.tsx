import type { ReactNode } from 'react'

interface SectionProps {
  id: string
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function Section({ id, title, description, children, className = '' }: SectionProps) {
  return (
    <section id={id} className={`section-space ${className}`} aria-labelledby={`${id}-title`}>
      <div className="container-shell">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-5 md:mb-14">
          <h2 id={`${id}-title`} className="section-title">{title}</h2>
          {description && <p className="max-w-md text-muted">{description}</p>}
        </div>
        {children}
      </div>
    </section>
  )
}
