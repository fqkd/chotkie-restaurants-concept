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
  const carts = addLine(addLine(emptyCarts(), choDish), birdDish)
  assert.equal(carts.cho.length, 1)
  assert.equal(carts.ptichka.length, 1)
  assert.equal(carts.katenka.length, 0)
})

test('cart total and quantity recovery preserve the order', () => {
  const first = dishes[0]
  const carts = addLine(addLine(emptyCarts(), first), first)
  assert.equal(carts.cho[0].quantity, 2)
  assert.equal(cartTotal(carts.cho), first.price * 2)
  assert.equal(updateLine(carts, 'cho', first.id, -1).cho[0].quantity, 1)
})
