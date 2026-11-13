import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import en from '../../src/locales/en.json' with { type: 'json' }
import ru from '../../src/locales/ru.json' with { type: 'json' }
import it from '../../src/locales/it.json' with { type: 'json' }
import de from '../../src/locales/de.json' with { type: 'json' }
import fr from '../../src/locales/fr.json' with { type: 'json' }

const locales = { en, ru, it, de, fr }
const cards = '[data-regulation-id]'

for (const [language, locale] of Object.entries(locales)) {
  for (const width of [320, 390, 768, 1280, 1440, 3840]) {
    test(`regulations ${language}: accessible layout at ${width}px`, async ({ page }) => {
      const errors: string[] = []
      const pdfRequests: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      page.on('request', (request) => { if (request.resourceType() !== 'script' && /\.pdf(?:\?|$)/i.test(request.url())) pdfRequests.push(request.url()) })
      await page.setViewportSize({ width, height: 900 })
      await page.goto(`/?lang=${language}#/regulations`)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(locale.nav.regulations)
      await expect(page).toHaveTitle(`${locale.nav.regulations} — Beauty Dynastya`)
      await expect(page.locator(cards)).toHaveCount(4)
      await expect(page.locator('#regulation-language')).toHaveValue('auto')
      await expect(page.locator(`${cards} a[download]`)).toHaveCount(language === 'de' ? 2 : 4)
      await page.evaluate(() => document.fonts.ready)
      const overflow = await page.evaluate(() => {
        const width = document.documentElement.clientWidth
        return [...document.querySelectorAll('main *, header *, footer *')].filter((element) => {
          const box = element.getBoundingClientRect()
          return box.width > 0 && (box.left < -1 || box.right > width + 1)
        }).map((element) => ({ tag: element.tagName, className: element.className }))
      })
      expect(overflow).toEqual([])
      expect(errors).toEqual([])
      // Просмотр каталога не должен скачивать десятки мегабайт PDF.
      expect(pdfRequests).toEqual([])
    })
  }
}

test('category, search, reset and missing translations work together', async ({ page }) => {
  await page.goto('/?lang=ru#/regulations')
  const category = page.getByRole('group', { name: ru.regulations.category, exact: true })
  await category.getByRole('button', { name: 'Lash', exact: true }).click()
  await expect(page.locator(cards)).toHaveCount(2)
  await page.getByLabel(ru.regulations.search, { exact: true }).fill('  ЧЕК-ЛИСТ  ')
  await expect(page.locator(cards)).toHaveCount(1)
  await expect(page.locator(cards)).toHaveAttribute('data-regulation-id', 'lash-checklist')
  await category.getByRole('button', { name: 'Nails', exact: true }).click()
  await expect(page.locator(cards)).toHaveCount(0)
  await expect(page.getByRole('heading', { name: ru.regulations.empty })).toBeVisible()
  await page.getByRole('button', { name: ru.regulations.reset, exact: true }).click()
  await expect(page.locator(cards)).toHaveCount(4)
  await page.locator('#regulation-language').selectOption('de')
  await expect(page.locator(`${cards} a[download]`)).toHaveCount(2)
  await expect(page.locator('[data-regulation-id="lash-checklist"]')).toContainText('Перевода на DE пока нет')
  await expect(page.locator('[data-regulation-id="nails-regulations"]')).toContainText('Перевода на DE пока нет')
})

test('automatic document language follows the site and manual choice stays independent', async ({ page }) => {
  await page.goto('/?lang=ru#/regulations')
  const lash = page.locator('[data-regulation-id="lash-regulations"] a[download]')
  await expect(lash).toHaveAttribute('download', /_RU\.pdf$/)
  await page.getByRole('button', { name: 'IT', exact: true }).click()
  await expect(lash).toHaveAttribute('download', /_IT\.pdf$/)
  await page.locator('#regulation-language').selectOption('he')
  await page.getByRole('button', { name: 'FR', exact: true }).click()
  await expect(page.locator('#regulation-language')).toHaveValue('he')
  await expect(lash).toHaveAttribute('download', /_HE\.pdf$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(fr.nav.regulations)
  await page.locator('#regulation-language').selectOption('auto')
  await expect(lash).toHaveAttribute('download', /_FR\.pdf$/)
})

test('PMU filter includes all nine languages and uses the Russian original correctly', async ({ page }) => {
  await page.goto('/?lang=ru#/regulations')
  const category = page.getByRole('group', { name: ru.regulations.category, exact: true })
  const filter = category.getByRole('button', { name: 'PMU', exact: true })
  await filter.click()
  await expect(filter).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator(cards)).toHaveCount(1)
  const pmu = page.locator('[data-regulation-id="pmu-regulations"]')
  await expect(pmu.getByRole('heading')).toHaveText(ru.regulations.documents['pmu-regulations'].title)
  await expect(pmu.locator('a[download]')).toHaveAttribute('href', /Beauty_Dynasty_PMU_2027_NEW_PHOTOS_10_POINTS/)
  await expect(pmu.locator('a[download]')).toHaveAttribute('download', /_PMU_regulations_RU\.pdf$/)
  await page.getByLabel(ru.regulations.search, { exact: true }).fill('ПЕРМАНЕНТ')
  await expect(pmu).toBeVisible()
  await page.locator('#regulation-search').fill('')
  const links = new Set<string>()
  for (const language of ['ru', 'en', 'de', 'fr', 'it', 'es', 'pl', 'ro', 'he']) {
    await page.locator('#regulation-language').selectOption(language)
    await expect(pmu.locator('a[download]')).toHaveAttribute('download', new RegExp(`_PMU_regulations_${language.toUpperCase()}\\.pdf$`))
    const url = await pmu.locator('a[download]').getAttribute('href')
    expect(url).toBeTruthy()
    links.add(url!)
  }
  expect(links.size).toBe(9)
  await page.getByRole('button', { name: 'EN', exact: true }).click()
  await expect(page.getByRole('group', { name: en.regulations.category, exact: true }).getByRole('button', { name: 'PMU', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator(cards)).toHaveCount(1)
  await expect(pmu.getByRole('heading')).toHaveText(en.regulations.documents['pmu-regulations'].title)
  await page.locator('#regulation-language').selectOption('auto')
  const downloadPromise = page.waitForEvent('download')
  await pmu.locator('a[download]').click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('Beauty_Dynastya_PMU_regulations_EN.pdf')
  expect(await download.failure()).toBeNull()
  const popupPromise = page.waitForEvent('popup')
  await pmu.locator('a[target="_blank"]').click()
  const popup = await popupPromise
  await expect.poll(() => popup.url()).toMatch(/Beauty_Dynasty_PMU_2027_EN/)
  await popup.close()
})

test('hash route supports refresh, back, section links, skip link and mobile menu', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/?lang=ru')
  const menu = page.getByRole('button', { name: ru.ui.menu, exact: true })
  await menu.click()
  await page.locator('#main-navigation a[href="#/regulations"]').click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(ru.nav.regulations)
  await expect(menu).toHaveAttribute('aria-expanded', 'false')
  await expect(page.locator('#main')).toBeFocused()
  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(ru.nav.regulations)
  await page.getByRole('link', { name: ru.ui.skip, exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('#main')).toBeFocused()
  await expect(page).toHaveURL(/#\/regulations$/)
  await page.getByRole('link', { name: ru.ui.backToTop, exact: true }).click()
  await expect(page).toHaveURL(/#\/regulations$/)
  await menu.click()
  await page.locator('#main-navigation a[href="#judges"]').click()
  await expect(page.locator('#judges-title')).toBeInViewport()
  await expect(page.locator('#regulations-title')).toHaveCount(0)
  await page.goBack()
  await expect(page.locator('#regulations-title')).toBeVisible()
  await page.getByRole('link', { name: ru.regulations.back, exact: true }).click()
  await expect(page.locator('main h1')).toContainText('Beauty')
  await expect(page).toHaveTitle(ru.meta.title)
  await page.locator('footer a[href="#/regulations"]').click()
  await expect(page.locator('#regulations-title')).toBeVisible()
})

test('all 33 translations point to actual PDF files, with reading and downloading', async ({ page }) => {
  await page.goto('/?lang=en#/regulations')
  const links = new Set<string>()
  for (const language of ['ru', 'en', 'de', 'fr', 'it', 'es', 'pl', 'ro', 'he']) {
    await page.locator('#regulation-language').selectOption(language)
    const readLinks = page.locator(`${cards} a[target="_blank"]`)
    const downloadLinks = page.locator(`${cards} a[download]`)
    await expect(downloadLinks).toHaveCount(language === 'de' ? 2 : language === 'ro' ? 3 : 4)
    const hrefs = await readLinks.evaluateAll((elements) => elements.map((element) => (element as HTMLAnchorElement).href))
    const downloads = await downloadLinks.evaluateAll((elements) => elements.map((element) => (element as HTMLAnchorElement).href))
    expect(hrefs).toEqual(downloads)
    for (const href of hrefs) links.add(href)
  }
  expect(links.size).toBe(33)
  for (const href of links) {
    const response = await page.request.get(href)
    expect(response.ok(), href).toBe(true)
    expect(response.headers()['content-type'], href).toContain('application/pdf')
    expect((await response.body()).subarray(0, 5).toString(), href).toBe('%PDF-')
    await response.dispose()
  }
  await page.locator('#regulation-language').selectOption('en')
  const checklist = page.locator('[data-regulation-id="lash-checklist"]')
  const downloadPromise = page.waitForEvent('download')
  await checklist.locator('a[download]').click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('Beauty_Dynastya_LASH_checklist_EN.pdf')
  expect(await download.failure()).toBeNull()
  const downloadPath = await download.path()
  expect(downloadPath).not.toBeNull()
  expect((await readFile(downloadPath!)).subarray(0, 5).toString()).toBe('%PDF-')
  const popupPromise = page.waitForEvent('popup')
  await checklist.locator('a[target="_blank"]').click()
  const popup = await popupPromise
  await expect.poll(() => popup.url()).toMatch(/Beauty_Dynastya_LASH_Checklist_EN/)
  await popup.close()
})
