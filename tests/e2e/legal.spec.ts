import { expect, test } from '@playwright/test'
import { legalDocuments, legalSectionIds } from '../../src/data/legal'
import en from '../../src/locales/en.json' with { type: 'json' }
import ru from '../../src/locales/ru.json' with { type: 'json' }
import it from '../../src/locales/it.json' with { type: 'json' }
import de from '../../src/locales/de.json' with { type: 'json' }
import fr from '../../src/locales/fr.json' with { type: 'json' }

const locales = { en, ru, it, de, fr }

for (const [language, locale] of Object.entries(locales)) {
  for (const document of ['consent', 'privacy'] as const) {
    for (const width of [320, 1440]) {
      test(`${document} ${language}: readable legal document at ${width}px`, async ({ page }) => {
        const errors: string[] = []
        page.on('pageerror', (error) => errors.push(error.message))
        await page.setViewportSize({ width, height: 900 })
        await page.goto(`/?lang=${language}#/${document}`)
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(locale.legal[document].title)
        await expect(page).toHaveTitle(`${locale.legal[document].title} — Beauty Dynastya`)
        await expect(page.locator('html')).toHaveAttribute('lang', language)
        await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', locale.legal[document].intro)
        await expect(page.locator('article time')).toHaveAttribute('datetime', legalDocuments.publishedOn)
        if (Object.values(legalDocuments.operator).some((value) => !value.trim())) {
          await expect(page.locator('[data-legal-draft]')).toHaveText(locale.legal.draftNotice)
        } else {
          await expect(page.locator('[data-legal-draft]')).toHaveCount(0)
        }
        await expect(page.locator('article dd')).toHaveText((['name', 'country', 'address', 'email'] as const).map((field) => legalDocuments.operator[field] || locale.legal.operatorPlaceholders[field]))
        for (const section of legalSectionIds[document]) await expect(page.locator(`#legal-${section}`)).toBeVisible()
        await page.evaluate(() => document.fonts.ready)
        expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
        await page.reload()
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(locale.legal[document].title)
        expect(errors).toEqual([])
      })
    }
  }
}

test('consent is explicit, translated, and its document opens without losing the application', async ({ page }) => {
  let requests = 0
  await page.route('**/api/applications', (route) => {
    requests++
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' })
  })
  await page.goto('/?lang=ru')
  const consent = page.locator('#application-consent')
  await expect(consent).not.toBeChecked()
  await page.locator('#application-name').fill('Test Applicant')
  await page.locator('#application-country').fill('Germany')
  await page.locator('input[value="participant"]').check()
  await page.locator('#register button[type="submit"]').click()
  await expect(consent).toBeFocused()
  await expect(consent).toHaveAttribute('aria-invalid', 'true')
  await expect(page.locator('#consent-error')).toHaveText(ru.ui.consentRequired)
  expect(requests).toBe(0)

  const opened = page.waitForEvent('popup')
  await page.getByRole('link', { name: ru.legal.readConsent, exact: true }).click()
  const document = await opened
  await expect(document.getByRole('heading', { level: 1 })).toHaveText(ru.legal.consent.title)
  await document.close()
  await expect(page.locator('#application-name')).toHaveValue('Test Applicant')
  await expect(consent).not.toBeChecked()
  await page.getByRole('button', { name: 'DE', exact: true }).click()
  await expect(page.locator('#consent-error')).toHaveText(de.ui.consentRequired)
  await expect(page.getByRole('link', { name: de.legal.readConsent, exact: true })).toHaveAttribute('href', '?lang=de#/consent')
  await consent.focus()
  await page.keyboard.press('Space')
  await expect(consent).toBeChecked()
  await page.keyboard.press('Space')
  await expect(consent).not.toBeChecked()
  await page.locator('#register button[type="submit"]').click()
  await expect(page.locator('#consent-error')).toHaveText(de.ui.consentRequired)
  expect(requests).toBe(0)
})

for (const role of ['participant', 'judge', 'speaker']) {
  test(`${role}: submission includes the consent record and resets the checkbox on success`, async ({ page }) => {
    const bodies: Record<string, unknown>[] = []
    await page.route('**/api/applications', (route) => {
      bodies.push(route.request().postDataJSON() as Record<string, unknown>)
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' })
    })
    await page.goto('/?lang=ru')
    await page.locator('#application-name').fill('Test Applicant')
    await page.locator('#application-country').fill('Italy')
    await page.locator(`input[value="${role}"]`).check()
    await page.locator('#application-consent').check()
    await page.locator('#register button[type="submit"]').click()
    await expect(page.locator('#register [role="status"]')).toContainText(ru.form.success)
    expect(bodies).toHaveLength(1)
    expect(bodies[0]).toMatchObject({ personal_data_consent: true, consent_version: legalDocuments.version, language: 'ru', role })
    expect(bodies[0].consent_document).toBe('http://127.0.0.1:5174/?lang=ru#/consent')
    expect(bodies[0].privacy_policy).toBe('http://127.0.0.1:5174/?lang=ru#/privacy')
    expect(Number.isFinite(Date.parse(String(bodies[0].consent_given_at)))).toBe(true)
    await page.getByRole('button', { name: ru.ui.successClose, exact: true }).click()
    await expect(page.locator('#application-consent')).not.toBeChecked()
    await expect(page.locator('#application-name')).toHaveValue('')
  })
}

test('legal navigation supports language switching, related documents and return to application', async ({ page }) => {
  await page.goto('/?lang=ru')
  await page.locator('footer').getByRole('link', { name: ru.legal.privacy.title, exact: true }).click()
  await expect(page.locator('#main')).toBeFocused()
  await expect(page.locator('#legal-title')).toHaveText(ru.legal.privacy.title)
  await page.getByRole('button', { name: 'FR', exact: true }).click()
  await expect(page.locator('#legal-title')).toHaveText(fr.legal.privacy.title)
  await expect(page).toHaveTitle(`${fr.legal.privacy.title} — Beauty Dynastya`)
  await page.locator('article').getByRole('link', { name: fr.legal.consent.title, exact: true }).click()
  await expect(page.locator('#legal-title')).toHaveText(fr.legal.consent.title)
  await page.goBack()
  await expect(page.locator('#legal-title')).toHaveText(fr.legal.privacy.title)
  await page.getByRole('link', { name: fr.legal.back, exact: true }).click()
  await expect(page.locator('#application-name')).toBeVisible()
  await expect(page.locator('#application-consent')).not.toBeChecked()
})

test('the submission service rejects missing consent before making a request', async ({ page }) => {
  let requests = 0
  await page.route('**/api/applications', (route) => {
    requests++
    return route.abort()
  })
  await page.goto('/?lang=ru')
  const rejected = await page.evaluate(async () => {
    const { submitApplication } = await import('/src/services/applications.ts')
    try {
      await submitApplication({ fullName: 'Test Applicant', country: 'Italy', role: 'judge', botcheck: false, consent: false }, 'ru', new AbortController().signal)
      return false
    } catch { return true }
  })
  expect(rejected).toBe(true)
  expect(requests).toBe(0)
})
