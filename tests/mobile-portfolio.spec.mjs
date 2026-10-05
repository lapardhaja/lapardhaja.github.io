import { expect, test } from '@playwright/test'

const projectWidth = testInfo => testInfo.project.use.viewport?.width ?? 1440

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('keeps the redesigned long-scroll page inside a phone viewport', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'desktop-chromium', 'This is phone-specific coverage.')
  for (const section of ['top', 'about', 'experience', 'education', 'licenses', 'projects', 'skills', 'publications', 'recognitions', 'contact']) {
    await expect(page.locator(`#${section}`)).toBeAttached()
  }
  const dimensions = await page.evaluate(() => ({ pageWidth: document.documentElement.scrollWidth, viewportWidth: window.innerWidth }))
  expect(dimensions.pageWidth).toBeLessThanOrEqual(dimensions.viewportWidth)

  const heroBounds = await page.locator('.hero-inner, .hero-copy, .hero-portrait').evaluateAll(elements => elements.map(element => {
    const bounds = element.getBoundingClientRect()
    return { left: bounds.left, right: bounds.right }
  }))
  for (const bounds of heroBounds) {
    expect(bounds.left).toBeGreaterThanOrEqual(0)
    expect(bounds.right).toBeLessThanOrEqual(dimensions.viewportWidth)
  }

  const contact = page.locator('#contact')
  await contact.scrollIntoViewIfNeeded()
  await expect(contact.getByRole('link', { name: 'servetlap29@gmail.com' })).toBeVisible()
  await expect(contact.getByRole('link', { name: /LinkedIn/ })).toBeVisible()
  await expect(contact.getByRole('link', { name: /GitHub/ })).toBeVisible()
  const emailLayout = await contact.locator('.contact-email').evaluate(email => {
    const card = email.closest('.contact-card')
    const cardStyle = getComputedStyle(card)
    const availableWidth = card.clientWidth - parseFloat(cardStyle.paddingLeft) - parseFloat(cardStyle.paddingRight)
    return {
      height: email.getBoundingClientRect().height,
      lineHeight: parseFloat(getComputedStyle(email).lineHeight),
      emailWidth: email.scrollWidth,
      availableWidth,
      whiteSpace: getComputedStyle(email).whiteSpace
    }
  })
  expect(emailLayout.whiteSpace).toBe('nowrap')
  expect(emailLayout.height).toBeLessThanOrEqual(emailLayout.lineHeight + 1)
  expect(emailLayout.emailWidth).toBeLessThanOrEqual(emailLayout.availableWidth + 1)
  const contactBounds = await contact.locator('.contact-intro, .contact-card').evaluateAll(elements => elements.map(element => {
    const bounds = element.getBoundingClientRect()
    return { left: bounds.left, right: bounds.right }
  }))
  for (const bounds of contactBounds) {
    expect(bounds.left).toBeGreaterThanOrEqual(0)
    expect(bounds.right).toBeLessThanOrEqual(dimensions.viewportWidth)
  }
})

test('keeps the portrait with the name before the mobile introduction', async ({ page }, testInfo) => {
  test.skip(projectWidth(testInfo) > 900, 'The stacked portrait layout applies below 900px.')
  const { name, portrait, role } = await page.locator('.hero').evaluate(element => {
    const heading = element.querySelector('h1').getBoundingClientRect()
    const image = element.querySelector('.hero-portrait').getBoundingClientRect()
    const introduction = element.querySelector('.hero-role').getBoundingClientRect()
    return {
      name: { top: heading.top, bottom: heading.bottom },
      portrait: { top: image.top, bottom: image.bottom },
      role: { top: introduction.top, bottom: introduction.bottom }
    }
  })
  expect(portrait.top).toBeGreaterThanOrEqual(name.bottom)
  expect(role.top).toBeGreaterThanOrEqual(portrait.bottom)
})

test('keeps the hero photo in its rectangular 5:7 frame', async ({ page }) => {
  const ratio = await page.locator('.hero-portrait > img').evaluate(image => {
    return image.offsetWidth / image.offsetHeight
  })
  expect(ratio).toBeCloseTo(5 / 7, 2)
})

test('opens a touch-safe menu and navigates to experience', async ({ page }, testInfo) => {
  test.skip(projectWidth(testInfo) > 900, 'The full-screen menu applies below 900px.')
  const menu = page.locator('.menu-toggle')
  await expect(menu).toHaveCSS('width', '48px')
  await expect(menu).toHaveCSS('height', '48px')
  await expect(menu).toHaveAccessibleName('Open navigation')
  await expect(page.locator('.site-nav')).toHaveAttribute('inert', '')
  await menu.click()
  await expect(menu).toHaveAccessibleName('Close navigation')
  await expect(menu).toBeFocused()
  await expect(menu).toHaveCSS('position', 'fixed')
  await expect(page.locator('.mobile-nav-heading, .mobile-nav-close')).toHaveCount(0)
  await expect(page.locator('body')).toHaveClass(/menu-open/)
  await expect(page.locator('html')).toHaveClass(/menu-open/)
  await expect(page.locator('html')).toHaveCSS('overflow-y', 'hidden')
  await expect(page.locator('.scroll-progress')).toHaveCSS('opacity', '0')
  const menuBounds = await page.locator('.site-nav').evaluate(element => {
    const bounds = element.getBoundingClientRect()
    return { top: bounds.top, bottom: bounds.bottom, height: bounds.height, viewportHeight: window.innerHeight }
  })
  expect(menuBounds.top).toBe(0)
  expect(menuBounds.bottom).toBeGreaterThanOrEqual(menuBounds.viewportHeight)
  expect(menuBounds.height).toBeGreaterThanOrEqual(menuBounds.viewportHeight)
  const closeControlTop = await menu.evaluate(element => element.getBoundingClientRect().top)
  await page.locator('.site-nav').evaluate(element => element.scrollTop = element.scrollHeight)
  await expect.poll(() => menu.evaluate(element => element.getBoundingClientRect().top)).toBe(closeControlTop)
  await menu.click()
  await expect(page.locator('body')).not.toHaveClass(/menu-open/)
  await expect(page.locator('.site-nav')).toHaveAttribute('inert', '')
  await menu.click()
  await page.getByRole('link', { name: 'Experience', exact: true }).click()
  await expect(page).toHaveURL(/#experience$/)
  await expect(page.locator('#experience')).toBeInViewport()
})

test('uses tablet width for two clear navigation columns', async ({ page }, testInfo) => {
  test.skip(projectWidth(testInfo) <= 620 || projectWidth(testInfo) > 900, 'Two-column navigation applies to tablets.')
  await page.locator('.menu-toggle').click()
  const [about, experience] = await page.locator('.site-nav a').evaluateAll(links => links.slice(0, 2).map(link => {
    const { left, top } = link.getBoundingClientRect()
    return { left, top }
  }))
  expect(experience.left).toBeGreaterThan(about.left)
  expect(Math.abs(experience.top - about.top)).toBeLessThan(2)
})

test('uses one scrollable column for the compact phone menu', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'small-phone-320', 'Compact phone navigation coverage uses the small-phone profile.')
  await page.setViewportSize({ width: 375, height: 432 })
  await page.locator('.menu-toggle').click()
  const links = await page.locator('.site-nav a').evaluateAll(items => items.slice(0, 2).map(link => {
    const { left, top } = link.getBoundingClientRect()
    return { left, top }
  }))
  expect(Math.abs(links[0].left - links[1].left)).toBeLessThan(2)
  expect(links[1].top).toBeGreaterThan(links[0].top)
  const linkHeight = await page.locator('.site-nav a').first().evaluate(link => link.getBoundingClientRect().height)
  expect(linkHeight).toBeGreaterThanOrEqual(44)
  const navSize = await page.locator('.site-nav').evaluate(nav => ({ scrollHeight: nav.scrollHeight, clientHeight: nav.clientHeight }))
  expect(navSize.scrollHeight).toBeGreaterThan(navSize.clientHeight)
})

test('keeps institution-logo role and publication controls usable by touch', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'desktop-chromium', 'This is phone-specific coverage.')
  const treasuryDetails = page.locator('#role-treasury .role-more')
  await expect(page.locator('.role-more')).toHaveCount(6)
  await expect(treasuryDetails).not.toHaveAttribute('open', '')
  await treasuryDetails.locator('summary').click()
  await expect(treasuryDetails).toHaveAttribute('open', '')
  await expect(treasuryDetails).toContainText('interface requirements')

  await page.locator('#tab-hntb').evaluate(element => element.scrollIntoView({ block: 'center' }))
  await page.locator('#tab-hntb').click()
  await expect(page.locator('#tab-hntb')).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('#role-hntb')).toBeVisible()
  await expect(page.locator('#role-treasury')).toBeHidden()
  await expect(page.locator('#role-hntb img')).toHaveAttribute('src', 'images/hntb-logo.jpg')
  const hntbDetails = page.locator('#role-hntb .role-more')
  await expect(hntbDetails).not.toHaveAttribute('open', '')
  await hntbDetails.locator('summary').click()
  await expect(hntbDetails).toHaveAttribute('open', '')
  await expect(hntbDetails).toContainText('dynamic traffic assignment')

  await page.locator('#conferences-tab').evaluate(element => element.scrollIntoView({ block: 'center' }))
  await page.locator('#conferences-tab').click()
  await expect(page.locator('#conferences-tab')).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('#conferences')).toBeVisible()
  await page.locator('#datasets-tab').click()
  await expect(page.locator('#datasets-tab')).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('#datasets')).toBeVisible()
  await expect(page.locator('#datasets .publication-citation strong').first()).toHaveText('Lapardhaja, S.')
  await expect(page.locator('.publication-card.is-linkable')).toHaveCount(15)

  await page.locator('#journals-tab').click()
  const firstJournal = page.locator('#journals .publication-card').first()
  await expect(firstJournal.locator('a')).toHaveAttribute('href', 'https://doi.org/10.1016/j.trc.2024.104809')
  const publicationPopup = page.waitForEvent('popup')
  await firstJournal.locator('h3').click()
  const popup = await publicationPopup
  expect(popup).toBeTruthy()
  await popup.close()
})

test('shows every experience position in a vertical mobile list and reveals the selected role', async ({ page }, testInfo) => {
  test.skip(projectWidth(testInfo) > 900, 'The vertical position list applies below 900px.')
  const experience = page.locator('#experience')
  const roleRail = experience.locator('.role-rail')
  await roleRail.scrollIntoViewIfNeeded()

  await expect(roleRail).toHaveCSS('display', 'grid')
  await expect(roleRail).toHaveCSS('overflow-x', 'visible')
  const { tabs, viewportWidth } = await roleRail.evaluate(element => ({
    viewportWidth: window.innerWidth,
    tabs: [...element.querySelectorAll('[role="tab"]')].map(tab => {
      const bounds = tab.getBoundingClientRect()
      return { left: bounds.left, right: bounds.right, top: bounds.top, bottom: bounds.bottom }
    })
  }))
  expect(tabs).toHaveLength(6)
  for (const bounds of tabs) {
    expect(bounds.left).toBeGreaterThanOrEqual(0)
    expect(bounds.right).toBeLessThanOrEqual(viewportWidth)
    expect(bounds.bottom - bounds.top).toBeGreaterThanOrEqual(44)
  }
  expect(tabs[1].top).toBeGreaterThan(tabs[0].top)

  await roleRail.getByRole('tab', { name: /HNTB.*Engineer I/ }).click()
  await expect(page.locator('#role-hntb')).toBeVisible()
  await expect(page.locator('#role-hntb')).toBeInViewport()
})

test('expands selected mobile details inline and keeps publication categories in view', async ({ page }, testInfo) => {
  test.skip(projectWidth(testInfo) > 620, 'Inline details and the compact publication grid apply below 620px.')

  await expect(page.locator('#role-treasury')).toBeVisible()
  expect(await page.locator('#role-treasury').evaluate(element => element.parentElement.className)).toBe('role-rail')
  expect(await page.locator('#role-treasury').evaluate(element => element.previousElementSibling.id)).toBe('tab-treasury')

  await page.locator('#tab-hntb').click()
  await expect(page.locator('#role-hntb')).toBeVisible()
  expect(await page.locator('#role-hntb').evaluate(element => element.parentElement.className)).toBe('role-rail')
  expect(await page.locator('#role-hntb').evaluate(element => element.previousElementSibling.id)).toBe('tab-hntb')

  await page.locator('#education-tab-ms').click()
  await expect(page.locator('#education-ms')).toBeVisible()
  expect(await page.locator('#education-ms').evaluate(element => element.parentElement.className)).toBe('education-grid')
  expect(await page.locator('#education-ms').evaluate(element => element.previousElementSibling.id)).toBe('education-tab-ms')

  const publicationTabs = page.locator('.publication-tabs')
  await publicationTabs.scrollIntoViewIfNeeded()
  await expect(publicationTabs).toHaveCSS('display', 'grid')
  const { viewportWidth, bounds } = await publicationTabs.evaluate(element => ({
    viewportWidth: window.innerWidth,
    bounds: [...element.querySelectorAll('[role="tab"]')].map(tab => {
      const rect = tab.getBoundingClientRect()
      return { left: rect.left, right: rect.right }
    })
  }))
  expect(bounds).toHaveLength(6)
  for (const tab of bounds) {
    expect(tab.left).toBeGreaterThanOrEqual(0)
    expect(tab.right).toBeLessThanOrEqual(viewportWidth)
  }
})

test('reveals degree details and makes available credentials clickable', async ({ page }, testInfo) => {
  test.skip(projectWidth(testInfo) > 620, 'The compact degree cards apply below 620px.')
  await page.locator('#education-tab-phd').evaluate(element => element.scrollIntoView({ block: 'center' }))
  await expect(page.locator('#education-tab-phd')).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('#education-phd')).toBeVisible()
  await page.locator('#education-tab-phd').click()
  await expect(page.locator('#education-tab-phd')).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('#education-tab-phd')).toHaveCSS('background-color', 'rgb(212, 233, 243)')
  await expect(page.locator('#education-tab-phd img')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  await expect(page.locator('#education-tab-phd img')).toHaveCSS('mix-blend-mode', 'multiply')
  await expect(page.locator('#education-tab-phd img')).toHaveCSS('width', '132px')
  await expect(page.locator('#education-tab-phd img')).toHaveCSS('height', '92px')
  await expect(page.locator('#education-phd')).toBeVisible()
  await expect(page.locator('#education-phd')).toContainText('3.96 / 4.00')
  await expect(page.locator('#education-phd .detail-link')).toHaveAttribute('href', 'https://escholarship.org/uc/item/36d9r9cw')
  await expect(page.locator('.education-card .card-arrow')).toHaveCount(0)

  await page.locator('#education-tab-ms').evaluate(element => element.scrollIntoView({ block: 'center' }))
  await page.locator('#education-tab-ms').click()
  await expect(page.locator('#education-tab-ms')).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('#education-ms')).toBeVisible()
  await expect(page.locator('#education-ms')).toContainText('GPA')
  await expect(page.locator('#education-ms')).toContainText('3.96 / 4.00')

  const njLicense = page.locator('.license-primary')
  await njLicense.evaluate(element => element.scrollIntoView({ block: 'center' }))
  await expect(njLicense).toContainText('24GE06379100')
  await expect(njLicense.locator('a')).toHaveCount(0)
  await expect(page.locator('.license-list .license-card-link')).toHaveCount(3)
  await expect(page.getByRole('link', { name: /AWS Certified Cloud Practitioner/ })).toHaveAttribute('href', 'https://www.credly.com/badges/a15977da-79b2-4a82-9e19-69c09dbab9f6/public_url')
  await expect(page.getByRole('link', { name: /IBM Data Science Professional Certificate/ })).toHaveAttribute('href', 'https://www.coursera.org/account/accomplishments/specialization/certificate/45Y8SQ6S2AE6')
  await expect(page.getByRole('link', { name: /Engineer in Training/ })).toHaveAttribute('href', 'https://account.ncees.org/rn/2076739-1553832-6fdd2c0')
})

test('uses concise live and code actions in every project card', async ({ page }) => {
  const project = page.locator('#projects .project-card').filter({ hasText: 'BottleProof' })
  await project.evaluate(element => element.scrollIntoView({ block: 'center' }))

  await expect(page.locator('#projects .project-more')).toHaveCount(0)
  await expect(project.getByRole('link', { name: 'Live' })).toBeVisible()
  await expect(project.getByRole('link', { name: 'Code' })).toBeVisible()
  await expect(project).toContainText('Tesseract OCR')
})

test('keeps the grouped skills map readable on a phone', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'desktop-chromium', 'This is phone-specific coverage.')
  const skills = page.locator('#skills')
  await skills.evaluate(element => element.scrollIntoView({ block: 'center' }))
  await expect(skills.locator('.skill-group')).toHaveCount(5)
  await expect(skills.locator('.skills-nav')).toHaveCount(0)
  await expect(skills.locator('.skill-group').filter({ hasText: 'Software' }).first()).toContainText('Python')
  await expect(skills.locator('.skill-group').filter({ hasText: 'Transportation' })).toContainText('VISSIM')
  const dimensions = await page.evaluate(() => ({ pageWidth: document.documentElement.scrollWidth, viewportWidth: window.innerWidth }))
  expect(dimensions.pageWidth).toBeLessThanOrEqual(dimensions.viewportWidth)
})
