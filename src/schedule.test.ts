import test from 'node:test'
import assert from 'node:assert/strict'
import { bookingDates, brunchOffset, eventDate, isFutureBooking } from './schedule.ts'

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
