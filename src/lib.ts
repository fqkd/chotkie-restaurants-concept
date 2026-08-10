export type RestaurantId = 'cho' | 'ptichka' | 'katenka' | 'besame'

export type Restaurant = {
  id: RestaurantId
  name: string
  eyebrow: string
  address: string
  image: string
  accent: string
  text: string
  moods: string[]
  description: string
  capabilities: string[]
  ordering: boolean
}

export type Dish = {
  id: string
  restaurantId: RestaurantId
  name: string
  description: string
  price: number
  image: string
  available: boolean
}

export type CartLine = Dish & { quantity: number }
export type Carts = Record<RestaurantId, CartLine[]>

export const restaurants: Restaurant[] = [
  {
    id: 'cho',
    name: 'Чо-Чо',
    eyebrow: 'Бодрый ресторан',
    address: 'ул. Дальняя, 41/1',
    image: 'assets/cho-cho.webp',
    accent: '#d8ff3e',
    text: '#151515',
    moods: ['Шумно и весело', 'Большая компания', 'День рождения'],
    description: 'Мировая кухня, караоке и яркий вечер в одном месте.',
    capabilities: ['Столик', 'Меню', 'Доставка', 'События', 'Торты'],
    ordering: true,
  },
  {
    id: 'ptichka',
    name: 'Птичка-Невеличка',
    eyebrow: 'Легко и жизнерадостно',
    address: 'ул. Красная, 133А',
    image: 'assets/ptichka.webp',
    accent: '#f7c514',
    text: '#111111',
    moods: ['Семейный обед', 'Лёгкий ужин', 'В саду'],
    description: 'Солнечный ресторан с блюдами из птицы и большим летним садом.',
    capabilities: ['Столик', 'Меню', 'Доставка', 'Торты'],
    ordering: true,
  },
  {
    id: 'katenka',
    name: 'Катенька-Катюша',
    eyebrow: 'Кухня прекрасного города',
    address: 'ул. Красная, 16',
    image: 'assets/katenka.webp',
    accent: '#c42531',
    text: '#ffffff',
    moods: ['Гости города', 'Русская кухня', 'Тихий вечер'],
    description: 'Современное прочтение традиций вкуса и гостеприимства Екатеринодара.',
    capabilities: ['Столик', 'Меню', 'Доставка', 'Торты'],
    ordering: false,
  },
  {
    id: 'besame',
    name: 'Bésame mucho',
    eyebrow: 'Сиеста и любовь',
    address: 'ул. Красная, 78',
    image: 'assets/besame.webp',
    accent: '#df725e',
    text: '#ffffff',
    moods: ['Свидание', 'Неспешный завтрак', 'Вино и разговор'],
    description: 'Испано-французское шеф-бистро с настроением долгой сиесты.',
    capabilities: ['Столик', 'Меню', 'Афиша', 'Торты'],
    ordering: false,
  },
]

export const dishes: Dish[] = [
  {
    id: 'sirena',
    restaurantId: 'cho',
    name: 'Тартар Sirena',
    description: 'Мраморная говядина и фри из батата. Позиция названа на официальном сайте.',
    price: 890,
    image: 'assets/cho-dish.webp',
    available: true,
  },
  {
    id: 'seafood',
    restaurantId: 'cho',
    name: 'Сковородка морепродуктов',
    description: 'Демонстрационная карточка позиции из раздела «Хиты».',
    price: 990,
    image: 'assets/cho-interior.webp',
    available: true,
  },
  {
    id: 'bird',
    restaurantId: 'ptichka',
    name: 'Сезонное блюдо из птицы',
    description: 'Нейтральное демонстрационное содержимое; состав уточняется в действующем меню.',
    price: 760,
    image: 'assets/ptichka.webp',
    available: true,
  },
  {
    id: 'seasonal',
    restaurantId: 'ptichka',
    name: 'Сезонная позиция',
    description: 'Демонстрационная позиция для сценария заказа.',
    price: 590,
    image: 'assets/katenka.webp',
    available: false,
  },
]

export const emptyCarts = (): Carts => ({ cho: [], ptichka: [], katenka: [], besame: [] })

export function cartTotal(lines: CartLine[]) {
  return lines.reduce((total, line) => total + line.price * line.quantity, 0)
}

export function addLine(carts: Carts, dish: Dish): Carts {
  const lines = carts[dish.restaurantId]
  const existing = lines.find((line) => line.id === dish.id)
  const next = existing
    ? lines.map((line) => (line.id === dish.id ? { ...line, quantity: line.quantity + 1 } : line))
    : [...lines, { ...dish, quantity: 1 }]
  return { ...carts, [dish.restaurantId]: next }
}

export function updateLine(carts: Carts, restaurantId: RestaurantId, dishId: string, delta: number): Carts {
  const next = carts[restaurantId]
    .map((line) => (line.id === dishId ? { ...line, quantity: line.quantity + delta } : line))
    .filter((line) => line.quantity > 0)
  return { ...carts, [restaurantId]: next }
}

export function parseHash(hash: string) {
  const clean = hash.replace(/^#\/?/, '') || 'home'
  const [route, query = ''] = clean.split('?')
  return { route, params: new URLSearchParams(query) }
}

export function findRestaurant(id: string | null | undefined) {
  return restaurants.find((restaurant) => restaurant.id === id) ?? restaurants[0]
}

export function findDish(id: string | null | undefined) {
  return dishes.find((dish) => dish.id === id) ?? dishes[0]
}
