import test from 'node:test'
import assert from 'node:assert/strict'
import { addLine, cartTotal, dishes, emptyCarts, parseHash, updateLine } from './lib.ts'

test('hash route keeps a deep-link state after reload', () => {
  const result = parseHash('#booking?restaurant=ptichka&source=event')
  assert.equal(result.route, 'booking')
  assert.equal(result.params.get('restaurant'), 'ptichka')
  assert.equal(result.params.get('source'), 'event')
})

test('carts stay isolated by restaurant', () => {
  const choDish = dishes.find((dish) => dish.restaurantId === 'cho')!
  const birdDish = dishes.find((dish) => dish.restaurantId === 'ptichka')!
  const katenkaDish = dishes.find((dish) => dish.restaurantId === 'katenka')!
  const carts = addLine(addLine(addLine(emptyCarts(), choDish), birdDish), katenkaDish)
  assert.equal(carts.cho.length, 1)
  assert.equal(carts.ptichka.length, 1)
  assert.equal(carts.katenka.length, 1)
  assert.equal(carts.besame.length, 0)
})

test('cart total and quantity recovery preserve the order', () => {
  const first = dishes[0]
  const carts = addLine(addLine(emptyCarts(), first), first)
  assert.equal(carts.cho[0].quantity, 2)
  assert.equal(cartTotal(carts.cho), first.price * 2)
  assert.equal(updateLine(carts, 'cho', first.id, -1).cho[0].quantity, 1)
})

test('different presentation choices remain separate cart lines', () => {
  const dish = dishes[0]
  const carts = addLine(addLine(emptyCarts(), dish), dish, 'Без соуса')
  assert.equal(carts.cho.length, 2)
  assert.equal(cartTotal(carts.cho), dish.price * 2)
  const updated = updateLine(carts, 'cho', dish.id, -1, 'Без соуса')
  assert.equal(updated.cho.length, 1)
  assert.equal(updated.cho[0].modifier, 'Стандартная подача')
})
