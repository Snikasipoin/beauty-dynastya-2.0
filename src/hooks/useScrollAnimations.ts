import type { RefObject } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap'

export function useScrollAnimations(scope: RefObject<HTMLElement | null>, dependencies: readonly unknown[] = []) {
  useGSAP(() => {
    const root = scope.current
    if (!root) return
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      root.querySelectorAll<HTMLElement>('[data-card]').forEach((element) => {
        gsap.from(element, {
          opacity: 0,
          y: 28,
          duration: 0.65,
          ease: 'power3.out',
          // До запуска триггера контент остаётся видимым и доступным.
          immediateRender: false,
          scrollTrigger: { trigger: element, start: 'top 94%', once: true },
        })
      })
    })
    ScrollTrigger.refresh()
    return () => media.revert()
  }, { scope, dependencies: [...dependencies], revertOnUpdate: true })
}
