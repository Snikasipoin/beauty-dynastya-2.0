import { expect, test } from '@playwright/test'
import { conference } from '../../src/data/conference'
import en from '../../src/locales/en.json' with { type: 'json' }
import ru from '../../src/locales/ru.json' with { type: 'json' }
import it from '../../src/locales/it.json' with { type: 'json' }
import de from '../../src/locales/de.json' with { type: 'json' }
import fr from '../../src/locales/fr.json' with { type: 'json' }

const locales = { en, ru, it, de, fr }

for (const [language, locale] of Object.entries(locales)) {
  for (const width of [320, 390, 768, 1024, 1280, 1440, 1920, 3840]) {
    test(`conference ${language}: complete accessible page at ${width}px`, async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      await page.setViewportSize({ width, height: 900 })
      await page.goto(`/?lang=${language}#/conference`)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(locale.conference.title)
      await expect(page).toHaveTitle(locale.conference.metaTitle)
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', locale.conference.metaDescription)
      await expect(page.locator('.conference-hero .conference-date')).toHaveText(locale.conference.dates)
      await expect(page.locator('.conference-track-list li')).toHaveText([...conference.tracks])
      const buttons = page.locator('[data-conference-cta]')
      await expect(buttons).toHaveCount(2)
      for (const button of await buttons.all()) {
        await expect(button).toHaveText(locale.conference.cta)
        await expect(button).toHaveAttribute('href', conference.telegram)
        await expect(button).toHaveAttribute('target', '_blank')
        await expect(button).toHaveAttribute('rel', /noopener/)
      }
      await expect(page.locator('.conference-seats')).toContainText('100')
      await expect(page.locator('.conference-benefits')).toContainText(locale.conference.benefits.translation.title)
      await page.evaluate(() => document.fonts.ready)
      await expect.poll(() => page.locator('.conference-hero-image').evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
      const overflow = await page.evaluate(() => {
        const width = document.documentElement.clientWidth
        return [...document.querySelectorAll('main *, header *, footer *')].filter((element) => {
          const rect = element.getBoundingClientRect()
          return rect.width > 0 && (rect.right > width + 1 || rect.left < -1)
        }).map((element) => ({ tag: element.tagName, className: element.className }))
      })
      expect(overflow).toEqual([])
      if (width >= 1440) expect((await page.locator('header').boundingBox())!.height).toBeLessThan(100)
      expect(errors).toEqual([])
    })
  }
}

test('homepage teaser, dedicated pages, history and language changes stay connected', async ({ page }) => {
  await page.goto('/?lang=ru')
  const teaser = page.locator('#conference-preview')
  await expect(teaser.getByRole('heading')).toHaveText(ru.conference.teaserTitle)
  await expect(teaser).toContainText(ru.conference.dates)
  await expect(teaser).toContainText('100')
  await teaser.getByRole('link', { name: ru.conference.teaserCta }).click()
  await expect(page.locator('#conference-title')).toHaveText(ru.conference.title)
  await expect(page.locator('#main')).toBeFocused()
  await expect(page.locator('#main-navigation a[href="#/conference"]')).toHaveAttribute('aria-current', 'page')
  await page.getByRole('button', { name: 'DE', exact: true }).click()
  await expect(page.locator('#conference-title')).toHaveText(de.conference.title)
  await expect(page).toHaveTitle(de.conference.metaTitle)
  await expect(page).toHaveURL(/\?lang=de#\/conference$/)
  await page.reload()
  await expect(page.locator('#conference-title')).toHaveText(de.conference.title)
  await page.locator('footer a[href="#/regulations"]').click()
  await expect(page.locator('#regulations-title')).toBeVisible()
  await page.goBack()
  await expect(page.locator('#conference-title')).toBeVisible()
  await page.locator('.conference-back').click()
  await expect(teaser.getByRole('heading')).toHaveText(de.conference.teaserTitle)
  await expect(page).toHaveTitle(de.meta.title)
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', de.meta.description)
})

test('highlighted mobile conference link, skip link and Telegram registration work', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/?lang=ru')
  const menu = page.locator('button[aria-controls="main-navigation"]')
  await menu.click()
  await page.locator('#main-navigation a[href="#/conference"]').click()
  await expect(menu).toHaveAttribute('aria-expanded', 'false')
  await expect(page.locator('#conference-title')).toHaveText(ru.conference.title)
  await page.getByRole('link', { name: ru.ui.skip, exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#\/conference$/)
  await expect(page.locator('#main')).toBeFocused()
  await page.getByRole('link', { name: ru.ui.backToTop, exact: true }).click()
  await expect(page).toHaveURL(/#\/conference$/)
  // Проверяем точный адрес перехода, не вступая в группу и не отправляя данные.
  await page.context().route(conference.telegram, (route) => route.fulfill({ contentType: 'text/html', body: '<title>Telegram registration</title>' }))
  const popupPromise = page.waitForEvent('popup')
  await page.locator('.conference-hero [data-conference-cta]').click()
  const popup = await popupPromise
  await expect(popup).toHaveURL(conference.telegram)
  await popup.close()
  await menu.click()
  await page.locator('#main-navigation a[href="#judges"]').click()
  await expect(page.locator('#judges-title')).toBeInViewport()
})
