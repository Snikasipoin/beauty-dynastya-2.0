import { expect, test } from '@playwright/test'
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

for (const [language, locale] of Object.entries(locales)) {
  for (const width of widths) {
    test(`${language}: complete page without overflow at ${width}px`, async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      await page.setViewportSize({ width, height: 900 })
      await page.goto(`/?lang=${language}`)
      await expect(page.locator('html')).toHaveAttribute('lang', language)
      await expect(page.locator('#about-title')).toHaveText(locale.about.title)
      await expect(page.locator('[data-judge-id]')).toHaveCount(37)
      await expect(page.locator('#speakers li[data-card]')).toHaveCount(5)
      await expect(page.locator('#participants li')).toHaveCount(3)
      await expect(page.locator('#register')).toBeVisible()
      await page.evaluate(() => document.fonts.ready)
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
  for (const [category, count] of Object.entries({ lash: 21, pmu: 7, brows: 2, lamination: 1, nails: 5, hair: 1, all: 37 })) {
    await page.locator(`[data-filter="${category}"]`).click()
    await expect(page.locator('[data-judge-id]')).toHaveCount(count)
    await expect(page.locator(`[data-filter="${category}"]`)).toHaveAttribute('aria-pressed', 'true')
  }
  await page.locator('[data-filter="pmu"]').click()
  await page.getByRole('button', { name: 'RU', exact: true }).click()
  await expect(page.locator('#judges-title')).toHaveText(ru.judges.title)
  await expect(page.locator('[data-judge-id]')).toHaveCount(7)
  await expect(page).toHaveURL(/lang=ru/)
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru')
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
