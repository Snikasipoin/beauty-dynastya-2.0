import { expect, test } from '@playwright/test'
import en from '../../src/locales/en.json' with { type: 'json' }
import ru from '../../src/locales/ru.json' with { type: 'json' }
import it from '../../src/locales/it.json' with { type: 'json' }
import de from '../../src/locales/de.json' with { type: 'json' }
import fr from '../../src/locales/fr.json' with { type: 'json' }

const locales = { en, ru, it, de, fr }
const cases = [
  { method: 'instagram', value: 'https://www.instagram.com/test.user/?igsh=test', normalized: '@test.user', type: 'text' },
  { method: 'telegram', value: 'https://t.me/test_user', normalized: '@test_user', type: 'text' },
  { method: 'email', value: 'contact@example.com', normalized: 'contact@example.com', type: 'email' },
  { method: 'whatsapp', value: '+44 (7700) 900-123', normalized: '+447700900123', type: 'tel' },
] as const

for (const [language, locale] of Object.entries(locales)) {
  for (const contact of cases) {
    test(language + ': sends preferred contact through ' + contact.method, async ({ page }) => {
      let body: Record<string, unknown> | undefined
      await page.route('**/api/applications', route => {
        body = route.request().postDataJSON() as Record<string, unknown>
        return route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' })
      })
      await page.setViewportSize({ width: 390, height: 1000 })
      await page.goto('/?lang=' + language)
      await page.locator('#application-name').fill('Contact Test')
      await page.locator('#application-country').fill('Italy')
      await page.locator('input[value="participant"]').check()
      await expect(page.locator('input[name="contact_method"]:checked')).toHaveCount(0)
      await page.locator('input[name="contact_method"][value="' + contact.method + '"]').check()
      const field = page.locator('#application-contact')
      await expect(field).toHaveAttribute('type', contact.type)
      await expect(field).toHaveAttribute('placeholder', locale.form.contactPlaceholders[contact.method])
      await field.fill(contact.value)
      await page.locator('#application-consent').check()
      await page.locator('#register button[type="submit"]').click()
      await expect(page.locator('#register [role="status"]')).toContainText(locale.form.success)
      expect(body).toMatchObject({ contact_method: contact.method, contact_value: contact.normalized, language })
      await page.getByRole('button', { name: locale.ui.successClose, exact: true }).click()
      await expect(page.locator('input[name="contact_method"]:checked')).toHaveCount(0)
      await expect(field).toHaveCount(0)
    })
  }
}

test('requires a contact method and validates its format before sending', async ({ page }) => {
  let requests = 0
  await page.route('**/api/applications', route => {
    requests++
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' })
  })
  await page.goto('/?lang=ru')
  await page.locator('#application-name').fill('Contact Test')
  await page.locator('#application-country').fill('Italy')
  await page.locator('input[value="participant"]').check()
  await page.locator('#application-consent').check()
  const submit = page.locator('#register button[type="submit"]')
  await submit.click()
  await expect(page.locator('input[name="contact_method"]').first()).toBeFocused()
  await expect(page.locator('#contact-method-error')).toHaveText(ru.ui.contactMethodRequired)
  await page.locator('input[name="contact_method"][value="email"]').check()
  const field = page.locator('#application-contact')
  await field.fill('wrong-email')
  await submit.click()
  await expect(field).toBeFocused()
  await expect(page.locator('#contact-error')).toHaveText(ru.ui.contactEmailInvalid)
  await page.locator('input[name="contact_method"][value="whatsapp"]').check()
  await expect(field).toHaveValue('')
  await field.fill('123')
  await submit.click()
  await expect(page.locator('#contact-error')).toHaveText(ru.ui.contactPhoneInvalid)
  await page.locator('input[name="contact_method"][value="telegram"]').check()
  await field.fill('https://foreign.test/user')
  await submit.click()
  await expect(page.locator('#contact-error')).toHaveText(ru.ui.contactProfileInvalid)
  await page.getByRole('button', { name: 'DE', exact: true }).click()
  await expect(field).toHaveValue('https://foreign.test/user')
  await expect(page.locator('#contact-error')).toHaveText(de.ui.contactProfileInvalid)
  expect(requests).toBe(0)
})
