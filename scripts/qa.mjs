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
  if (path.includes('/#dish?')) {
    const photo = await page.locator('.dish-hero img').evaluate((image) => image.complete && image.naturalWidth > 0)
    if (!photo) throw new Error(`${path}: фотография блюда не загрузилась`)
  }
  if (overflow) report.overflows.push({ path, width })
  if (errors.length) report.consoleErrors.push({ path, width, errors })
  await page.screenshot({ path: `qa-output/${name}-${width}.png`, fullPage: true })
  if (path.includes('/#dish?') && await page.locator('.modifier-row button').count()) {
    await page.evaluate(() => { const screen = document.querySelector('.phone-frame > .screen'); if (screen) screen.scrollTop = screen.scrollHeight })
    const gap = await page.evaluate(() => {
      const option = document.querySelector('.modifier-row button:last-child')?.getBoundingClientRect()
      const action = document.querySelector('.sticky-primary')?.getBoundingClientRect()
      return option && action ? action.top - option.bottom : -1
    })
    if (gap < 8) throw new Error(`${path}: действие перекрывает последний вариант подачи (зазор ${gap}px)`)
  }
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
  '/#menu?restaurant=cho&mode=order&category=hot',
  '/#dish?restaurant=cho&id=sirena',
  '/#dish?restaurant=cho&id=seafood',
  '/#dish?restaurant=ptichka&id=bird',
  '/#dish?restaurant=ptichka&id=seasonal',
  '/#dish?restaurant=katenka&id=katenka-pie',
  '/#dish?restaurant=katenka&id=katenka-dessert',
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
// External availability is verified separately with an HTTP client configured for the network proxy.
report.links.push({ href: rulesHref, status: 'href-ok', hasRoot: false })
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

await scenario('повод → ресторан → сохранённый запрос столика', async (page) => {
  await page.goto(`${base}/#home`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /Свидание/ }).click()
  await page.waitForTimeout(650)
  if (await page.locator('.restaurant-list-card').count() !== 1) throw new Error('Фильтр по поводу не сузил список ресторанов')
  await page.locator('.restaurant-list-card').filter({ hasText: 'Bésame mucho' }).click()
  await page.getByRole('button', { name: /Открыть «Bésame mucho»/ }).click()
  await page.getByRole('button', { name: 'Забронировать для свидания' }).click()
  await page.getByRole('button', { name: 'Завтра' }).click()
  await page.getByRole('button', { name: '20:00' }).click()
  await page.getByRole('button', { name: /Продолжить/ }).click()
  await page.getByLabel('Имя').fill('Мария')
  await page.getByLabel('Телефон').fill('+7 900 000-00-00')
  await page.getByRole('button', { name: 'Сохранить демо-заявку' }).click()
  await page.getByRole('heading', { name: 'Параметры записаны' }).waitFor()
  await page.getByRole('button', { name: 'Открыть историю' }).click()
  await page.getByRole('heading', { name: 'История и быстрый возврат' }).waitFor()
  await page.locator('.past-order').filter({ hasText: 'Демо-заявка в браузере' }).waitFor()
  if (await page.locator('.past-order').filter({ hasText: 'Демо-заявка в браузере' }).count() !== 1) throw new Error('Запрос столика не сохранён в истории')
  await page.reload({ waitUntil: 'networkidle' })
  await page.locator('.past-order').filter({ hasText: 'Демо-заявка в браузере' }).getByRole('button', { name: 'Подробнее' }).click()
  await page.getByRole('button', { name: 'Изменить заявку' }).click()
  await page.getByRole('heading', { name: 'Когда вас ждать?' }).waitFor()
  await page.getByRole('button', { name: '19:30' }).click()
  await page.getByRole('button', { name: /Продолжить/ }).click()
  await page.getByRole('button', { name: 'Сохранить демо-заявку' }).click()
  await page.getByRole('button', { name: 'Открыть историю' }).click()
  await page.getByRole('heading', { name: 'История и быстрый возврат' }).waitFor()
  if (await page.locator('.past-order').filter({ hasText: 'Демо-заявка в браузере' }).count() !== 1) throw new Error('Редактирование создало дубль запроса')
  await page.goto(`${base}/#booking-success?restaurant=besame`, { waitUntil: 'networkidle' })
  await page.getByRole('heading', { name: 'Заявка не найдена' }).waitFor()
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
  await page.getByRole('button', { name: 'Без фри из батата' }).click()
  await page.getByRole('button', { name: /Добавить в корзину/ }).click()
  await page.locator('.cart-line').getByText('Без фри из батата').waitFor()
  await page.getByRole('button', { name: /К оформлению/ }).click()
  if (await page.getByRole('button', { name: /Заполните адрес/ }).isEnabled()) throw new Error('Оплата доступна без адреса и времени')
  await page.getByRole('button', { name: /Выбрать адрес/ }).click()
  await page.getByRole('dialog', { name: 'Выбор адреса' }).getByRole('button', { name: 'ул. Северная, 305, Краснодар' }).click()
  await page.getByText('ул. Северная, 305, Краснодар').waitFor()
  await page.getByRole('button', { name: /Выбрать время/ }).click()
  const timeChoices = page.getByRole('dialog', { name: 'Выбор времени' }).getByRole('button')
  const firstSlot = await timeChoices.first().innerText()
  const secondSlot = await timeChoices.last().innerText()
  if (firstSlot === secondSlot) throw new Error('Разные интервалы отображаются одинаково')
  await timeChoices.first().click()
  const firstRoute = page.url()
  await page.locator('.checkout-row').filter({ hasText: firstSlot }).click()
  await page.getByRole('dialog', { name: 'Выбор времени' }).getByRole('button', { name: secondSlot }).click()
  if (page.url() === firstRoute) throw new Error('Разные интервалы открывают одно время')
  await page.getByLabel('Имя').fill('Мария')
  await page.getByLabel('Телефон').fill('+7 900 000-00-00')
  await page.getByRole('button', { name: 'Перейти к оплате' }).click()
  await page.getByRole('heading', { name: 'Оплата не прошла' }).waitFor()
  await page.getByRole('button', { name: 'Вернуться в корзину' }).click()
  await page.getByText('Тартар из мраморной говядины с фри из батата').waitFor()
  await page.goBack()
  await page.getByRole('button', { name: 'Повторить оплату' }).click()
  await page.getByRole('heading', { name: /Заказ сохранён/ }).waitFor()
  const receipt = await page.locator('.receipt').innerText()
  if (!receipt.includes('Северная, 305') || !receipt.includes(secondSlot) || !receipt.includes('Банковская карта')) throw new Error('В заказе потеряны адрес, интервал или оплата')
  await page.getByRole('button', { name: 'История действий' }).click()
  await page.getByRole('heading', { name: 'История и быстрый возврат' }).waitFor()
  if (await page.locator('.past-order').count() !== 1) throw new Error('Оформленный заказ не записан в историю')
  await page.getByRole('button', { name: 'Повторить заказ' }).click()
  await page.getByText('Тартар из мраморной говядины с фри из батата').waitFor()
  await page.locator('.cart-line').getByText('Без фри из батата').waitFor()
  if (!page.url().includes('restaurant=cho')) throw new Error('Повтор открыл корзину другого ресторана')
})

await scenario('прямые ссылки и оплата при получении', async (page) => {
  await page.goto(`${base}/#payment-error?restaurant=cho&service=delivery&address=krasnaya&time=1930`, { waitUntil: 'networkidle' })
  await page.getByRole('heading', { name: 'Оплата не начиналась' }).waitFor()
  const emptyCart = await page.evaluate(() => JSON.parse(localStorage.getItem('chotkie-demo-carts') || '{}').cho || [])
  if (emptyCart.length) throw new Error('Прямая ссылка добавила блюда в корзину')
  await page.goto(`${base}/#dish?restaurant=cho&id=sirena`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /Добавить в корзину/ }).click()
  await page.getByRole('button', { name: /К оформлению/ }).click()
  await page.getByRole('button', { name: /Выбрать адрес/ }).click()
  await page.getByRole('dialog', { name: 'Выбор адреса' }).getByRole('button', { name: 'ул. Красная, 120, Краснодар' }).click()
  await page.getByRole('button', { name: /Выбрать время/ }).click()
  await page.getByRole('dialog', { name: 'Выбор времени' }).getByRole('button').first().click()
  await page.getByLabel('Имя').fill('Мария')
  await page.getByLabel('Телефон').fill('+7 900 000-00-00')
  await page.locator('select').selectOption('При получении')
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Подтвердить заказ' }).click()
  await page.getByRole('heading', { name: 'Заказ сохранён' }).waitFor()
  if (!await page.locator('.receipt').getByText(/При получении/).count()) throw new Error('Способ оплаты потерян после перезагрузки')
  const orders = await page.evaluate(() => JSON.parse(localStorage.getItem('chotkie-demo-orders') || '[]'))
  if (orders.length !== 1) throw new Error('Заказ при получении не сохранён ровно один раз')
  await page.goto(`${base}/#order-success?restaurant=ptichka&id=${orders[0].id}`, { waitUntil: 'networkidle' })
  await page.getByRole('heading', { name: 'Заказ не найден' }).waitFor()
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
  await page.getByRole('button', { name: /Пирог с томатами и моцареллой/ }).click()
  await page.getByRole('button', { name: /Добавить в корзину/ }).click()
  await page.goto(`${base}/#cart?restaurant=cho`, { waitUntil: 'networkidle' })
  await page.getByText('Тартар из мраморной говядины с фри из батата').waitFor()
  if (await page.getByText('Паштет из куриной печени с брусничным соусом').count()) throw new Error('Корзина «Чо-Чо» содержит позицию другого ресторана')
  await page.goto(`${base}/#cart?restaurant=ptichka`, { waitUntil: 'networkidle' })
  await page.getByText('Паштет из куриной печени с брусничным соусом').waitFor()
  if (await page.getByText('Тартар из мраморной говядины с фри из батата').count()) throw new Error('Корзина «Птички-Невелички» содержит позицию другого ресторана')
  await page.goto(`${base}/#cart?restaurant=katenka`, { waitUntil: 'networkidle' })
  await page.getByText('Пирог с томатами и моцареллой').waitFor()
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
  await page.getByRole('button', { name: 'Горячее', exact: true }).click()
  await page.locator('.menu-tabs button.active').getByText('Горячее', { exact: true }).waitFor()
  await page.getByText('Сковородка морепродуктов').waitFor()
  if (await page.getByText('Тартар из мраморной говядины с фри из батата').count()) throw new Error('Категория «Горячее» показывает закуску')
  await page.getByRole('button', { name: 'Все блюда' }).click()
  await page.locator('.menu-tabs button.active').getByText('Все блюда', { exact: true }).waitFor()
  await page.getByText('Тартар из мраморной говядины с фри из батата').waitFor()
})

await scenario('профиль валидирует контакты и открывает избранное', async (page) => {
  await page.goto(`${base}/#profile`, { waitUntil: 'networkidle' })
  await page.getByLabel('Имя').fill('Мария')
  await page.getByLabel('Телефон').fill('+7 ')
  if (await page.getByRole('button', { name: 'Сохранить контакты' }).isEnabled()) throw new Error('Профиль сохраняет невалидный телефон')
  await page.getByLabel('Телефон').fill('+7 900 000-00-00')
  await page.getByRole('button', { name: 'Сохранить контакты' }).click()
  await page.reload({ waitUntil: 'networkidle' })
  if (await page.getByLabel('Имя').inputValue() !== 'Мария') throw new Error('Имя не сохранилось в профиле')
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
