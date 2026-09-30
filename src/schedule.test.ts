import test from 'node:test'
import assert from 'node:assert/strict'
import { bookingDates, brunchOffset, eventDate, isFutureBooking, orderSlotLabel, upcomingOrderSlots } from './schedule.ts'

test('Sunday brunch follows the actual Krasnodar calendar', () => {
  const wednesday = new Date('2026-09-30T16:00:00Z')
  const thursday = new Date('2026-10-01T16:00:00Z')
  assert.equal(brunchOffset(wednesday), 4)
  assert.equal(brunchOffset(thursday), 3)
  assert.equal(eventDate('brunch', thursday), '4 октября')
})

test('booking rejects elapsed slots and keeps event day in the future', () => {
  const now = new Date('2026-09-30T16:15:00Z') // 19:15 in Krasnodar
  assert.equal(isFutureBooking('Сегодня', '19:00', now), false)
  assert.equal(isFutureBooking('Сегодня', '19:30', now), true)
  assert.equal(isFutureBooking('Завтра', '18:30', now), true)
  assert.equal(isFutureBooking(eventDate('brunch', now), '11:00', now, 'brunch'), true)
  assert.equal(bookingDates(now)[2], '2 октября')
})

test('checkout slots are distinct future instants with stable date labels', () => {
  const now = new Date('2026-09-30T20:40:00Z') // 23:40 in Krasnodar
  const slots = upcomingOrderSlots(now)
  assert.equal(slots[0].label, '1 октября, 01:00–01:30')
  assert.equal(slots[1].label, '1 октября, 01:30–02:00')
  assert.notEqual(slots[0].id, slots[1].id)
  assert.equal(orderSlotLabel(slots[0].id), slots[0].label)
})
