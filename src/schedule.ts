const zone = 'Europe/Moscow'

function localDate(now: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    year: 'numeric', month: '2-digit', day: '2-digit', timeZone: zone,
  }).formatToParts(now)
  const part = (type: string) => Number(parts.find((item) => item.type === type)?.value)
  return new Date(Date.UTC(part('year'), part('month') - 1, part('day'), 12))
}

export function formatKrasnodarDate(offsetDays: number, now = new Date()) {
  const date = localDate(now)
  date.setUTCDate(date.getUTCDate() + offsetDays)
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', timeZone: zone }).format(date)
}

export function brunchOffset(now = new Date()) {
  const days = 7 - localDate(now).getUTCDay()
  return days || 7
}

export function eventDate(eventId: string | null | undefined, now = new Date()) {
  return formatKrasnodarDate(eventId === 'brunch' ? brunchOffset(now) : 3, now)
}

export function bookingDates(now = new Date()) {
  return ['Сегодня', 'Завтра', formatKrasnodarDate(2, now)]
}

export function isFutureBooking(date: string, time: string, now = new Date(), eventId?: string | null) {
  if (eventId && date === eventDate(eventId, now)) return true
  const offset = bookingDates(now).indexOf(date)
  if (offset < 0) return false
  if (offset > 0) return true
  const parts = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: zone,
  }).formatToParts(now)
  const part = (type: string) => Number(parts.find((item) => item.type === type)?.value)
  const [hour, minute] = time.split(':').map(Number)
  return hour * 60 + minute > part('hour') * 60 + part('minute')
}

export function orderSlotLabel(id: string | null | undefined) {
  if (!id || !/^\d{13}$/.test(id)) return null
  const start = new Date(Number(id))
  if (Number.isNaN(start.getTime())) return null
  const end = new Date(start.getTime() + 30 * 60_000)
  const date = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', timeZone: zone }).format(start)
  const clock = (value: Date) => new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: zone }).format(value)
  return `${date}, ${clock(start)}–${clock(end)}`
}

export function upcomingOrderSlots(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: zone,
  }).formatToParts(now)
  const part = (type: string) => Number(parts.find((item) => item.type === type)?.value)
  const localMinutes = part('hour') * 60 + part('minute')
  const firstMinutes = Math.ceil((localMinutes + 60) / 30) * 30
  const deltaMinutes = firstMinutes - localMinutes
  // The slot ID is an absolute instant, so its label survives midnight and reloads.
  const first = now.getTime() - now.getSeconds() * 1000 - now.getMilliseconds() + deltaMinutes * 60_000
  return [0, 1].map((index) => {
    const id = String(first + index * 30 * 60_000)
    return { id, label: orderSlotLabel(id)! }
  })
}
