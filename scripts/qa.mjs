import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'

const remoteBase = process.env.QA_BASE_URL
const base = remoteBase ? remoteBase.replace(/\/$/, '') : 'http://127.0.0.1:4273'
let preview

async function waitForServer(url) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(`Сервер не ответил: ${url}`)
}

if (!remoteBase) {
  preview = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4273', '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'] })
  await waitForServer(base)
}

await mkdir('qa-output', { recursive: true })
const browser = await chromium.launch({ headless: true })
const report = { base, pages: [], consoleErrors: [], overflows: [], links: [], scenarios: [] }

async function inspect(path, width, height, name) {
  const page = await browser.newPage({ viewport: { width, height } })
  const errors = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', (error) => errors.push(error.message))
  const response = await page.goto(`${base}${path}`, { waitUntil: 'networkidle' })
  if (!response?.ok()) throw new Error(`${path}: HTTP ${response?.status()}`)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
  if (overflow) report.overflows.push({ path, width })
  if (errors.length) report.consoleErrors.push({ path, width, errors })
  await page.screenshot({ path: `qa-output/${name}-${width}.png`, fullPage: true })
  report.pages.push({ path, width, status: response.status(), overflow, errors: errors.length })
  await page.close()
}

for (const width of [360, 390, 430]) await inspect('/#home', width, 844, 'prototype')
for (const width of [390, 768, 1440]) await inspect('/case/', width, width === 1440 ? 900 : 1024, 'case')

for (const path of [
  '/#discover?mood=%D0%A1%D0%B2%D0%B8%D0%B4%D0%B0%D0%BD%D0%B8%D0%B5',
  '/#booking?restaurant=besame',
  '/#event?id=live-night',
  '/#menu?restaurant=cho&mode=order',
  '/#payment-error?restaurant=cho',
  '/#loyalty',
]) await inspect(path, 390, 844, `deep-${report.pages.length}`)

const linkPage = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await linkPage.goto(`${base}/case/`, { waitUntil: 'networkidle' })
const links = await linkPage.locator('a.case-button').evaluateAll((anchors) => anchors.map((anchor) => anchor.href))
for (const href of new Set(links)) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  const response = await page.goto(href, { waitUntil: 'networkidle' })
  const hasRoot = await page.locator('#root').count()
  report.links.push({ href, status: response?.status(), hasRoot: Boolean(hasRoot) })
  if (!response?.ok() || !hasRoot) throw new Error(`Нерабочая ссылка презентации: ${href}`)
  await page.close()
}
await linkPage.close()

async function scenario(name, run) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  const errors = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', (error) => errors.push(error.message))
  await run(page)
  if (errors.length) throw new Error(`${name}: ошибки консоли ${errors.join('; ')}`)
  report.scenarios.push({ name, status: 'passed', url: page.url() })
  await page.close()
}

await scenario('повод → ресторан → бронирование → подтверждение', async (page) => {
  await page.goto(`${base}/#home`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /Свидание/ }).click()
  await page.waitForTimeout(650)
  await page.getByRole('button', { name: /Bésame mucho/ }).click()
  await page.getByRole('button', { name: 'Забронировать для свидания' }).click()
  await page.getByRole('button', { name: '20:00' }).click()
  await page.getByRole('button', { name: /Продолжить/ }).click()
  await page.getByRole('button', { name: 'Подтвердить демобронь' }).click()
  await page.getByRole('heading', { name: 'Столик выбран' }).waitFor()
})

await scenario('афиша → событие → бронирование', async (page) => {
  await page.goto(`${base}/#event?id=live-night`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /Выбрать столик/ }).click()
  await page.getByText(/Бронирование после события/).waitFor()
})

await scenario('позиция → корзина → ошибка оплаты → восстановление', async (page) => {
  await page.goto(`${base}/#dish?restaurant=cho&id=sirena`, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.removeItem('chotkie-demo-carts'))
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /Добавить в корзину/ }).click()
  await page.getByRole('button', { name: /К оформлению/ }).click()
  await page.getByRole('button', { name: 'Проверить сценарий оплаты' }).click()
  await page.getByRole('heading', { name: 'Оплата не прошла' }).waitFor()
  await page.getByRole('button', { name: 'Повторить оплату' }).click()
  await page.getByRole('heading', { name: /Заказ подтверждён/ }).waitFor()
})

await browser.close()
if (preview) preview.kill('SIGTERM')
await writeFile('qa-output/report.json', JSON.stringify(report, null, 2))

if (report.consoleErrors.length || report.overflows.length) {
  throw new Error(`QA не пройден: ${JSON.stringify({ consoleErrors: report.consoleErrors, overflows: report.overflows })}`)
}

console.log(JSON.stringify(report, null, 2))
