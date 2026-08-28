import { expect, test } from '@playwright/test'

test('keeps the full professional headline and current-employer portrait badge visible on desktop', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'This is desktop-specific coverage.')
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)

  const headline = await page.locator('#home-title').evaluate(element => {
    const range = document.createRange()
    range.selectNodeContents(element)
    return { lineBoxes: range.getClientRects().length, text: element.textContent?.trim() }
  })
  expect(headline.text).toBe('Servet Lapardhaja, Ph.D., P.E.')
  expect(headline.lineBoxes).toBe(1)
  await expect(page.locator('.hero-portrait')).toBeInViewport()
  await expect(page.locator('.hero-portrait figcaption')).toContainText('Currently at')
  await expect(page.locator('.hero-portrait figcaption')).toContainText(/U\.S\. Department\s*of the Treasury/)
  await expect(page.locator('.hero-portrait figcaption img')).toHaveAttribute('src', 'images/treasury-seal.png')
})

test('advances the gold scroll line as the page moves', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'This is desktop-specific coverage.')
  await page.goto('/')
  const progressLine = page.locator('[data-scroll-progress]')
  await expect(progressLine).toBeVisible()
  await expect(progressLine).toHaveCSS('height', '3px')
  await expect(progressLine.locator('span')).toHaveCSS('background-image', /gradient/)

  const initial = await progressLine.evaluate(element => Number(element.style.getPropertyValue('--progress')))
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await page.waitForFunction(() => Number(document.querySelector('[data-scroll-progress]')?.style.getPropertyValue('--progress')) > .9)
  const final = await progressLine.evaluate(element => Number(element.style.getPropertyValue('--progress')))
  expect(initial).toBe(0)
  expect(final).toBeGreaterThan(.9)
})
