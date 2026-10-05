import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  webServer: {
    command: 'npm run dev -- --port 3010 --strictPort',
    url: 'http://127.0.0.1:3010',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000
  },
  use: {
    baseURL: 'http://127.0.0.1:3010',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry'
  },
  projects: [
    { name: 'desktop-chromium', use: { browserName: 'chromium', viewport: { width: 1440, height: 1000 } } },
    { name: 'small-phone-320', use: { browserName: 'chromium', viewport: { width: 320, height: 640 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } },
    { name: 'iphone-se', use: { ...devices['iPhone SE'], browserName: 'chromium' } },
    { name: 'iphone-se-landscape', use: { ...devices['iPhone SE'], browserName: 'chromium', viewport: { width: 568, height: 320 } } },
    { name: 'iphone-13', use: { ...devices['iPhone 13'], browserName: 'chromium' } },
    { name: 'iphone-13-landscape', use: { ...devices['iPhone 13'], browserName: 'chromium', viewport: { width: 844, height: 390 }, screen: { width: 844, height: 390 } } },
    { name: 'iphone-13-safari', use: { ...devices['iPhone 13'], browserName: 'webkit' } },
    { name: 'pixel-7', use: { ...devices['Pixel 7'], browserName: 'chromium' } },
    { name: 'tablet-ipad-portrait', use: { ...devices['iPad (gen 7)'], browserName: 'chromium' } },
    { name: 'tablet-ipad-landscape', use: { ...devices['iPad (gen 7) landscape'], browserName: 'chromium' } }
  ]
})
