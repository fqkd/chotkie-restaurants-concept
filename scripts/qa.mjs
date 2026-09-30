import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'

const remoteBase = process.env.QA_BASE_URL
const base = remoteBase ? remoteBase.replace(/\/$/, '') : 'http://127.0.0.1:4273'
let preview
process.on('exit', () => {
  if (preview && !preview.killed) preview.kill('SIGTERM')
})

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

async function fetchExternal(url) {
  let lastError
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(15_000) })
    } catch (error) {
      lastError = error
    }
  }
  throw lastError
}

if (!remoteBase) {
  preview = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4273', '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'] })
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

for (const { width, height } of [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
]) await inspect('/#home', width, height, 'prototype')
await inspect('/#home', 1440, 900, 'prototype-desktop')
for (const { width, height } of [
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
]) await inspect('/case/', width, height, 'case')

const regressionPaths = [
  '/#discover?mood=%D0%A1%D0%B2%D0%B8%D0%B4%D0%B0%D0%BD%D0%B8%D0%B5',
  '/#restaurant?id=cho',
  '/#restaurant?id=ptichka',
  '/#restaurant?id=katenka',
  '/#restaurant?id=besame',
  '/#booking?restaurant=besame',
  '/#booking-details?restaurant=besame',
  '/#booking-success?restaurant=besame',
  '/#events',
  '/#event?id=live-night',
  '/#menu?restaurant=cho&mode=order',
  '/#menu?restaurant=cho&mode=order&category=drinks',
  '/#dish?restaurant=ptichka&id=seasonal',
  '/#cart?restaurant=cho',
  '/#checkout?restaurant=cho&address=selected&time=1930',
  '/#payment-error?restaurant=cho&service=delivery&address=selected&time=1930',
  '/#order-success?restaurant=cho&service=delivery&time=1930',
  '/#loyalty',
  '/#profile',
  '/#favorites',
  '/#history',
]
for (const { width, height } of [{ width: 360, height: 800 }, { width: 390, height: 844 }, { width: 430, height: 932 }]) {
  for (const path of regressionPaths) await inspect(path, width, height, `deep-${report.pages.length}`)
}
await inspect('/case/', 768, 900, 'case')

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
const contactLinks = await linkPage.locator('.contact-card a').evaluateAll((anchors) => anchors.map((anchor) => anchor.getAttribute('href')))
if (!contactLinks.includes('mailto:hello@eh.works')) throw new Error('В финальном блоке нет mailto:hello@eh.works')
if (!contactLinks.includes('https://eh.works')) throw new Error('В финальном блоке нет https://eh.works')
if (!contactLinks.includes('https://t.me/andrey_ergohaven')) throw new Error('В финальном блоке нет Telegram @andrey_ergohaven')
if (!contactLinks.includes('https://max.ru/id5041212966_biz')) throw new Error('В финальном блоке нет MAX +7 988 154-04-00')
const ehResponse = await fetchExternal('https://eh.works')
report.links.push({ href: 'mailto:hello@eh.works', status: 'syntax-ok', hasRoot: false })
report.links.push({ href: 'https://eh.works', status: ehResponse.status, hasRoot: false })
if (!ehResponse.ok) throw new Error(`eh.works: HTTP ${ehResponse.status}`)
await linkPage.close()

const appLinkPage = await browser.newPage({ viewport: { width: 390, height: 844 } })
await appLinkPage.goto(`${base}/#loyalty`, { waitUntil: 'networkidle' })
const rulesHref = await appLinkPage.getByRole('link', { name: /Официальные правила/ }).getAttribute('href')
if (rulesHref !== 'https://restoran-cho.ru/card') throw new Error(`Неверная ссылка на правила: ${rulesHref}`)
const rulesResponse = await fetch(rulesHref, { redirect: 'follow' })
report.links.push({ href: rulesHref, status: rulesResponse.status, hasRoot: false })
if (!rulesResponse.ok) throw new Error(`Официальные правила: HTTP ${rulesResponse.status}`)
await appLinkPage.goto(`${base}/#home`, { waitUntil: 'networkidle' })
const caseHref = await appLinkPage.locator('.stage-copy a').getAttribute('href')
const caseResponse = await fetch(new URL(caseHref, base), { redirect: 'follow' })
report.links.push({ href: new URL(caseHref, base).href, status: caseResponse.status, hasRoot: true })
if (!caseResponse.ok) throw new Error(`Ссылка приложения на презентацию: HTTP ${caseResponse.status}`)
await appLinkPage.close()

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

await scenario('карта → поиск → пустое состояние → геолокация', async (page) => {
  await page.context().grantPermissions(['geolocation'], { origin: new URL(base).origin })
  await page.context().setGeolocation({ latitude: 45.035, longitude: 38.974 })
  await page.goto(`${base}/#discover`, { waitUntil: 'networkidle' })
  const map = page.getByLabel('Все четыре ресторана')
  await map.locator('.leaflet-marker-icon').nth(1).click()
  if (await map.locator('.eh-location-list > button.active').count() !== 1) throw new Error('Маркер не синхронизировал выбранную карточку')
  await map.getByLabel('Поиск точки').fill('несуществующий ресторан')
  await map.getByText('Ничего не найдено').waitFor()
  if (await page.getByRole('button', { name: /Выберите ресторан/ }).isEnabled()) throw new Error('CTA активен при пустом поиске')
  await map.getByRole('button', { name: 'Очистить поиск' }).click()
  await map.getByText('Найдено ресторанов: 4').waitFor()
  await map.getByLabel('Поиск точки').fill('Красная, 78')
  await map.locator('.eh-location-list button').filter({ hasText: 'Bésame mucho' }).click()
  await map.getByRole('button', { name: /Рядом со мной/ }).click()
  await map.getByText('Расстояния рассчитаны от вашего положения').waitFor()
})

await scenario('повод → ресторан → бронирование → подтверждение', async (page) => {
  await page.goto(`${base}/#home`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /Свидание/ }).click()
  await page.waitForTimeout(650)
  if (await page.locator('.restaurant-list-card').count() !== 1) throw new Error('Фильтр по поводу не сузил список ресторанов')
  await page.locator('.restaurant-list-card').filter({ hasText: 'Bésame mucho' }).click()
  await page.getByRole('button', { name: /Открыть «Bésame mucho»/ }).click()
  await page.getByRole('button', { name: 'Забронировать для свидания' }).click()
  await page.getByRole('button', { name: '20:00' }).click()
  await page.getByRole('button', { name: /Продолжить/ }).click()
  await page.getByRole('button', { name: 'Отправить запрос' }).click()
  await page.getByRole('heading', { name: 'Параметры сохранены' }).waitFor()
})

await scenario('афиша → событие → бронирование', async (page) => {
  await page.goto(`${base}/#event?id=live-night`, { waitUntil: 'networkidle' })
  const liveDate = (await page.locator('.event-facts span').first().innerText()).trim()
  await page.getByRole('button', { name: /Выбрать столик/ }).click()
  await page.getByText(/Живая музыка и ужин/).waitFor()
  await page.locator('.option-row.dates button.selected').waitFor()
  if ((await page.locator('.option-row.dates button.selected').innerText()).replace(/\s+/g, ' ').trim() !== liveDate.replace(/\s+/g, ' ')) throw new Error('Дата бронирования не совпадает с датой события')
  await page.goto(`${base}/#event?id=brunch`, { waitUntil: 'networkidle' })
  const brunchDate = (await page.locator('.event-facts span').first().innerText()).trim()
  await page.getByRole('button', { name: /Выбрать столик/ }).click()
  await page.getByText(/Долгий воскресный завтрак/).waitFor()
  await page.locator('.option-row.dates button.selected').waitFor()
  if ((await page.locator('.option-row.dates button.selected').innerText()).replace(/\s+/g, ' ').trim() !== brunchDate.replace(/\s+/g, ' ')) throw new Error('Дата воскресного завтрака не совпадает с бронированием')
})

await scenario('позиция → корзина → ошибка оплаты → восстановление', async (page) => {
  await page.goto(`${base}/#dish?restaurant=cho&id=sirena`, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.removeItem('chotkie-demo-carts'))
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /Добавить в корзину/ }).click()
  await page.getByRole('button', { name: /К оформлению/ }).click()
  if (await page.getByRole('button', { name: /Заполните адрес/ }).isEnabled()) throw new Error('Оплата доступна без адреса и времени')
  await page.getByRole('button', { name: /Выбрать адрес/ }).click()
  await page.getByRole('button', { name: 'ул. Красная, 120, Краснодар' }).click()
  await page.getByRole('button', { name: /Выбрать время/ }).click()
  await page.getByRole('button', { name: 'Сегодня, 19:30–20:00' }).click()
  await page.getByRole('button', { name: 'Перейти к оплате' }).click()
  await page.getByRole('heading', { name: 'Оплата не прошла' }).waitFor()
  await page.getByRole('button', { name: 'Вернуться в корзину' }).click()
  await page.getByText('Тартар из мраморной говядины с фри из батата').waitFor()
  await page.goBack()
  await page.getByRole('button', { name: 'Повторить оплату' }).click()
  await page.getByRole('heading', { name: /Заказ подтверждён/ }).waitFor()
  await page.getByText(/Доставка · сегодня, 19:30/).waitFor()
})

await scenario('отдельные корзины ресторанов', async (page) => {
  await page.goto(`${base}/#home`, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.removeItem('chotkie-demo-carts'))
  await page.goto(`${base}/#dish?restaurant=cho&id=sirena`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /Добавить в корзину/ }).click()
  await page.goto(`${base}/#dish?restaurant=ptichka&id=bird`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /Добавить в корзину/ }).click()
  await page.goto(`${base}/#restaurant?id=katenka`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /Заказать/ }).click()
  await page.getByRole('button', { name: /Пирог ручной работы/ }).click()
  await page.getByRole('button', { name: /Добавить в корзину/ }).click()
  await page.goto(`${base}/#cart?restaurant=cho`, { waitUntil: 'networkidle' })
  await page.getByText('Тартар из мраморной говядины с фри из батата').waitFor()
  if (await page.getByText('Блюдо из птицы от шефа').count()) throw new Error('Корзина «Чо-Чо» содержит позицию другого ресторана')
  await page.goto(`${base}/#cart?restaurant=ptichka`, { waitUntil: 'networkidle' })
  await page.getByText('Блюдо из птицы от шефа').waitFor()
  if (await page.getByText('Тартар из мраморной говядины с фри из батата').count()) throw new Error('Корзина «Птички-Невелички» содержит позицию другого ресторана')
  await page.goto(`${base}/#cart?restaurant=katenka`, { waitUntil: 'networkidle' })
  await page.getByText('Пирог ручной работы').waitFor()
  if (await page.getByText('Тартар из мраморной говядины с фри из батата').count()) throw new Error('Корзина «Катеньки-Катюши» содержит позицию другого ресторана')
})

await scenario('избранное и состояния меню дают обратную связь', async (page) => {
  await page.goto(`${base}/#restaurant?id=besame`, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.removeItem('chotkie-favorites'))
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Добавить в избранное' }).click()
  await page.getByText('Ресторан добавлен в избранное').waitFor()
  await page.getByRole('button', { name: 'Убрать из избранного' }).click()
  await page.getByText('Ресторан добавлен в избранное').waitFor({ state: 'detached' })
  await page.goto(`${base}/#menu?restaurant=cho&mode=order`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Напитки' }).click()
  await page.getByRole('heading', { name: 'В этой категории пока пусто' }).waitFor()
  await page.getByRole('button', { name: 'Вернуться к популярному' }).click()
  await page.getByText('Тартар из мраморной говядины с фри из батата').waitFor()
})

await scenario('профиль валидирует контакты и открывает избранное', async (page) => {
  await page.goto(`${base}/#profile`, { waitUntil: 'networkidle' })
  await page.getByLabel('Телефон').fill('+7 ')
  if (await page.getByRole('button', { name: 'Сохранить контакты' }).isEnabled()) throw new Error('Профиль сохраняет невалидный телефон')
  await page.getByLabel('Телефон').fill('+7 900 000-00-00')
  await page.getByRole('button', { name: 'Сохранить контакты' }).click()
  await page.getByRole('button', { name: /Избранное/ }).click()
  await page.getByRole('heading', { name: 'Пока ничего нет' }).waitFor()
})

await browser.close()
if (preview) preview.kill('SIGTERM')
await writeFile('qa-output/report.json', JSON.stringify(report, null, 2))

if (report.consoleErrors.length || report.overflows.length) {
  throw new Error(`QA не пройден: ${JSON.stringify({ consoleErrors: report.consoleErrors, overflows: report.overflows })}`)
}

console.log(JSON.stringify(report, null, 2))
