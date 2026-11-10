import { expect, test } from '@playwright/test'
import { existsSync } from 'node:fs'
import { judges } from '../../src/data/judges'
import { speakers } from '../../src/data/speakers'
import { participants } from '../../src/data/participants'
import { judgeFilters } from '../../src/data/championship'
import en from '../../src/locales/en.json' with { type: 'json' }
import ru from '../../src/locales/ru.json' with { type: 'json' }
import it from '../../src/locales/it.json' with { type: 'json' }
import de from '../../src/locales/de.json' with { type: 'json' }
import fr from '../../src/locales/fr.json' with { type: 'json' }

const locales = { en, ru, it, de, fr }
const widths = [320, 390, 768, 1024, 1280, 1440, 1920, 3840]

function keys(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix]
  return Object.entries(value).flatMap(([key, entry]) => keys(entry, `${prefix}.${key}`)).sort()
}

test('all translations have the same complete key set', () => {
  for (const locale of Object.values(locales)) expect(keys(locale)).toEqual(keys(en))
})

test('every published person has a unique ID, a local poster and complete translations', () => {
  const groups = { judges, speakers, participants }
  const posters = [...Object.values(groups).flat().map((person) => person.poster), ...judges.flatMap(
    (judge) => judge.secondaryAssignment ? [judge.secondaryAssignment.poster] : [],
  )]
  expect(new Set(posters).size).toBe(posters.length)
  for (const [kind, people] of Object.entries(groups)) {
    const ids = people.map((person) => person.id).sort()
    expect(new Set(ids).size, `${kind}: duplicate ID`).toBe(ids.length)
    for (const person of people) {
      expect(existsSync(new URL(`../../src/assets/images/posters/${person.poster}.webp`, import.meta.url)), person.id).toBe(true)
      for (const link of person.links) expect(link.href).toMatch(/^https:\/\/www\.instagram\.com\/[a-zA-Z0-9_.]+\/$/)
    }
    for (const locale of Object.values(locales)) {
      expect(Object.keys(locale[kind as keyof typeof groups].people).sort()).toEqual(ids)
    }
  }
  for (const judge of judges) {
    if (!judge.secondaryAssignment) continue
    expect(judge.secondaryAssignment.category).not.toBe(judge.category)
    expect(existsSync(new URL(`../../src/assets/images/posters/${judge.secondaryAssignment.poster}.webp`, import.meta.url)), judge.id).toBe(true)
    for (const locale of Object.values(locales)) {
      const people: Record<string, { role: string; secondaryRole?: string }> = locale.judges.people
      expect(people[judge.id].secondaryRole).toBeTruthy()
    }
  }
  for (const speaker of speakers) {
    for (const locale of Object.values(locales)) {
      const people: Record<string, { facts: Record<string, { label: string; value: string }> }> = locale.speakers.people
      expect(Object.keys(people[speaker.id].facts).sort()).toEqual([...speaker.factIds].sort())
    }
  }
})

for (const [language, locale] of Object.entries(locales)) {
  for (const width of widths) {
    test(`${language}: complete page without overflow at ${width}px`, async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      await page.setViewportSize({ width, height: 900 })
      await page.goto(`/?lang=${language}`)
      await expect(page.locator('html')).toHaveAttribute('lang', language)
      await expect(page.locator('#about-title')).toHaveText(locale.about.title)
      await expect(page.locator('[data-judge-id]')).toHaveCount(judges.length)
      await expect(page.locator('#speakers li[data-card]')).toHaveCount(speakers.length)
      await expect(page.locator('#participants li')).toHaveCount(participants.length)
      await expect(page.locator('#register')).toBeVisible()
      await page.evaluate(() => document.fonts.ready)
      const typography = await page.evaluate(() => ({
        headings: [...document.querySelectorAll('h1,h2,h3')].map((heading) => getComputedStyle(heading).fontFamily),
        oswaldLoaded: [...document.fonts].some((font) => font.family === 'Oswald' && font.status === 'loaded'),
        speakerImageClasses: [...document.querySelectorAll('#speakers [data-person-poster] img')].map((image) => image.className),
      }))
      expect(typography.oswaldLoaded).toBe(true)
      for (const family of typography.headings) expect(family).toMatch(/^Oswald,/)
      for (const classes of typography.speakerImageClasses) {
        expect(classes.split(' ')).not.toContain('object-contain')
        expect(classes.split(' ')).not.toContain('w-full')
      }
      const overflow = await page.evaluate(() => {
        const viewport = document.documentElement.clientWidth
        return [...document.querySelectorAll('main *, header *, footer *')].filter((element) => {
          const rect = element.getBoundingClientRect()
          return rect.width > 0 && (rect.right > viewport + 1 || rect.left < -1)
        }).map((element) => ({ tag: element.tagName, className: element.className })).slice(0, 8)
      })
      expect(overflow).toEqual([])
      const geometry = await page.evaluate(() => {
        const cards = [...document.querySelectorAll<HTMLElement>('[data-judge-id]')]
        const photos = cards.map((card) => card.querySelector<HTMLElement>('[data-person-poster]')!)
        const spread = (elements: HTMLElement[], dimension: 'width' | 'height') => {
          const values = elements.map((element) => element.getBoundingClientRect()[dimension])
          return Math.max(...values) - Math.min(...values)
        }
        const speakerDetails = document.querySelector<HTMLDetailsElement>('#speakers details')
        if (speakerDetails) speakerDetails.open = true
        const speakerGaps = [...document.querySelectorAll<HTMLElement>('#speakers [data-card]')].map((card) => {
          const outer = card.getBoundingClientRect()
          const photo = card.querySelector<HTMLElement>('[data-person-poster]')!.getBoundingClientRect()
          return Math.max(Math.abs(photo.left - outer.left), Math.abs(photo.top - outer.top), innerWidth >= 1024 ? Math.abs(photo.bottom - outer.bottom) : Math.abs(photo.width - outer.width))
        })
        return { cardHeights: spread(cards, 'height'), photoHeights: spread(photos, 'height'), photoWidths: spread(photos, 'width'), speakerGap: Math.max(...speakerGaps) }
      })
      // Сравниваем фактическую геометрию, включая разные ряды и переводы.
      for (const difference of Object.values(geometry)) expect(difference).toBeLessThan(1)
      expect(errors).toEqual([])
    })
  }
}

test('category filters preserve state across language changes and reloads', async ({ page }) => {
  await page.goto('/?lang=en')
  for (const category of judgeFilters) {
    const expectedIds = judges.filter((judge) => (
      category === 'all' || judge.category === category || judge.secondaryAssignment?.category === category
    )).map((judge) => judge.id).sort()
    await page.locator(`[data-filter="${category}"]`).click()
    await expect(page.locator('[data-judge-id]')).toHaveCount(expectedIds.length)
    expect(await page.locator('[data-judge-id]').evaluateAll((cards) => cards.map((card) => card.getAttribute('data-judge-id')).sort())).toEqual(expectedIds)
    await expect(page.locator(`[data-filter="${category}"]`)).toHaveAttribute('aria-pressed', 'true')
  }
  await page.locator('[data-filter="pmu"]').click()
  await page.getByRole('button', { name: 'RU', exact: true }).click()
  await expect(page.locator('#judges-title')).toHaveText(ru.judges.title)
  await expect(page.locator('[data-judge-id]')).toHaveCount(judges.filter((judge) => judge.category === 'pmu').length)
  await expect(page).toHaveURL(/lang=ru/)
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru')
})

test('judges with two assignments show the matching role and poster in each category', async ({ page }) => {
  await page.goto('/?lang=ru')
  const jenny = page.locator('[data-judge-id="jenny-tronci-hebbel"]')
  const quynh = page.locator('[data-judge-id="quynh-nguyen"]')
  await expect(jenny).toHaveCount(1)
  await expect(jenny).toContainText(ru.judges.people['jenny-tronci-hebbel'].secondaryRole)
  await expect(quynh).toHaveCount(1)
  await expect(quynh).toContainText(ru.judges.people['quynh-nguyen'].secondaryRole)
  await page.locator('[data-filter="lash"]').click()
  await expect(jenny.locator('img')).toHaveAttribute('src', /jenny-tronci-hebbel-lash\.webp/)
  await expect(quynh.locator('img')).toHaveAttribute('src', /quynh-nguyen\.webp/)
  await page.locator('[data-filter="nails"]').click()
  await expect(jenny.locator('img')).toHaveAttribute('src', /jenny-tronci-hebbel\.webp/)
  await expect(quynh.locator('img')).toHaveAttribute('src', /quynh-nguyen-nails\.webp/)
})

test('controlled form validates, translates errors and survives API failures', async ({ page }) => {
  await page.goto('/?lang=en')
  const submit = page.locator('#register button[type="submit"]')
  await submit.click()
  await expect(page.locator('#application-name')).toBeFocused()
  await expect(page.locator('#name-error')).toHaveText(en.ui.required)
  await page.getByRole('button', { name: 'DE', exact: true }).click()
  await expect(page.locator('#name-error')).toHaveText(de.ui.required)
  await page.locator('#application-name').fill('Test Applicant')
  await page.locator('#application-country').fill('Germany')
  await page.locator('input[value="participant"]').check()
  await page.route('https://api.web3forms.com/submit', (route) => route.fulfill({ status: 500, contentType: 'application/json', body: '{"success":false}' }))
  await submit.click()
  await expect(page.locator('#register [role="alert"]')).toHaveText(de.ui.error)
  await expect(page.locator('#application-name')).toHaveValue('Test Applicant')
  await expect(submit).toBeEnabled()
  await page.unroute('https://api.web3forms.com/submit')
  let requests = 0
  await page.route('https://api.web3forms.com/submit', async (route) => {
    requests++
    const body = route.request().postDataJSON() as Record<string, unknown>
    expect(body.language).toBe('de')
    expect(body.role).toBe('participant')
    expect(body.full_name).toBe('Test Applicant')
    await new Promise((resolve) => setTimeout(resolve, 300))
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' })
  })
  await submit.click()
  await expect(submit).toBeDisabled()
  await expect(page.locator('#register [role="status"]')).toContainText(de.form.success)
  expect(requests).toBe(1)
})

test('mobile navigation works with keyboard and closes after selecting a section', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto('/?lang=fr')
  const toggle = page.getByRole('button', { name: fr.ui.menu, exact: true })
  await toggle.click()
  await expect(page.locator('#main-navigation')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(toggle).toBeFocused()
  await expect(page.locator('#main-navigation')).toBeHidden()
  await toggle.click()
  await page.locator('#main-navigation a[href="#judges"]').click()
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
})

test('motion preferences clean up GSAP and do not duplicate triggers', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/?lang=en')
  const triggerCount = () => page.evaluate(async () => {
    const { ScrollTrigger } = await import('/src/lib/gsap.ts')
    return ScrollTrigger.getAll().length
  })
  expect(await triggerCount()).toBe(0)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await expect.poll(triggerCount).toBeGreaterThan(0)
  const count = await triggerCount()
  await page.getByRole('button', { name: 'RU', exact: true }).click()
  expect(await triggerCount()).toBeLessThanOrEqual(count)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect.poll(triggerCount).toBe(0)
  const hidden = await page.locator('[data-card]').evaluateAll((cards) => cards.some((card) => getComputedStyle(card).opacity !== '1'))
  expect(hidden).toBe(false)
})
