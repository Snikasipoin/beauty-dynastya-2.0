import { expect, test } from '@playwright/test'
import ru from '../../src/locales/ru.json' with { type: 'json' }

test('logo rotation can be paused and stops when offscreen', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/?lang=ru')
  const scene = page.locator('.hero-logo-scene')
  const rotor = page.locator('.hero-logo-rotor')
  await expect(scene).toHaveAttribute('data-running', 'true')
  const initial = await rotor.evaluate(element => getComputedStyle(element).transform)
  await expect.poll(() => rotor.evaluate(element => getComputedStyle(element).transform)).not.toBe(initial)
  await page.getByRole('button', { name: ru.hero.logoPause, exact: true }).click()
  await expect(scene).toHaveAttribute('data-running', 'false')
  expect(await rotor.evaluate(element => getComputedStyle(element).animationPlayState)).toBe('paused')
  await page.getByRole('button', { name: ru.hero.logoResume, exact: true }).click()
  await expect(scene).toHaveAttribute('data-running', 'true')
  await page.locator('#register').scrollIntoViewIfNeeded()
  await expect(scene).toHaveAttribute('data-running', 'false')
  await scene.scrollIntoViewIfNeeded()
  await expect(scene).toHaveAttribute('data-running', 'true')
})

test('reduced motion keeps the original logo static and hides the rotation control', async ({ page }) => {
  await page.goto('/?lang=ru')
  expect(await page.locator('.hero-logo-rotor').evaluate(element => getComputedStyle(element).animationName)).toBe('none')
  await expect(page.locator('.hero-logo-control')).toBeHidden()
  await expect(page.locator('.hero-logo-front')).toBeVisible()
})
