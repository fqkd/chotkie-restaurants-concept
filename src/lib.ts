export type RestaurantId = 'cho' | 'ptichka' | 'katenka' | 'besame'

export type Restaurant = {
  id: RestaurantId
  name: string
  eyebrow: string
  address: string
  lat: number
  lng: number
  district: string
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
  category: 'appetizer' | 'hot' | 'dessert'
  presentationOption?: string
  available: boolean
}

export type CartLine = Dish & { quantity: number; modifier: string }
export type Carts = Record<RestaurantId, CartLine[]>

export const restaurants: Restaurant[] = [
  {
    id: 'cho',
    name: 'Чо-Чо',
    eyebrow: 'Бодрый ресторан',
    address: 'ул. Дальняя, 41/1',
    lat: 45.060955,
    lng: 38.963671,
    district: 'Фестивальный микрорайон',
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
    lat: 45.042018,
    lng: 38.976598,
    district: 'Центральный микрорайон',
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
    lat: 45.018162,
    lng: 38.968459,
    district: 'Исторический центр',
    image: 'assets/katenka.webp',
    accent: '#c42531',
    text: '#ffffff',
    moods: ['Гости города', 'Русская кухня', 'Тихий вечер'],
    description: 'Современное прочтение традиций вкуса и гостеприимства Екатеринодара.',
    capabilities: ['Столик', 'Меню', 'Доставка', 'Торты'],
    ordering: true,
  },
  {
    id: 'besame',
    name: 'Bésame mucho',
    eyebrow: 'Сиеста и любовь',
    address: 'ул. Красная, 78',
    lat: 45.029713,
    lng: 38.972450,
    district: 'Исторический центр',
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
    name: 'Тартар из мраморной говядины с фри из батата',
    description: 'Мраморная говядина и фри из батата.',
    price: 890,
    image: 'assets/sirena.webp',
    category: 'appetizer',
    presentationOption: 'Без фри из батата',
    available: true,
  },
  {
    id: 'seafood',
    restaurantId: 'cho',
    name: 'Сковородка морепродуктов',
    description: 'Морепродукты в горячей сковородке.',
    price: 990,
    image: 'assets/seafood.webp',
    category: 'hot',
    available: true,
  },
  {
    id: 'bird',
    restaurantId: 'ptichka',
    name: 'Паштет из куриной печени с брусничным соусом',
    description: 'Паштет, фундук, брусничный соус и чиабатта.',
    price: 520,
    image: 'assets/bird.webp',
    category: 'appetizer',
    presentationOption: 'Без брусничного соуса',
    available: true,
  },
  {
    id: 'seasonal',
    restaurantId: 'ptichka',
    name: 'Тар-тар из телёнка с перепелиным яйцом',
    description: 'Мраморная говядина, Grana Padano, трюфельный крем, яйцо и пшеничный хлеб.',
    price: 690,
    image: 'assets/seasonal.webp',
    category: 'appetizer',
    presentationOption: 'Без трюфельного крема',
    available: true,
  },
  {
    id: 'katenka-pie',
    restaurantId: 'katenka',
    name: 'Пирог с томатами и моцареллой',
    description: 'Лепёшка, томатный соус, моцарелла, черри, руккола и оливковое масло.',
    price: 560,
    image: 'assets/katenka-pie.webp',
    category: 'hot',
    available: true,
  },
  {
    id: 'katenka-dessert',
    restaurantId: 'katenka',
    name: 'Наполеон с брусничным вареньем',
    description: 'Слоёное тесто на сливочном масле, заварной крем и брусничное варенье.',
    price: 490,
    image: 'assets/katenka-dessert.webp',
    category: 'dessert',
    presentationOption: 'Без брусничного варенья',
    available: true,
  },
]

export const emptyCarts = (): Carts => ({ cho: [], ptichka: [], katenka: [], besame: [] })

export function cartTotal(lines: CartLine[]) {
  return lines.reduce((total, line) => total + line.price * line.quantity, 0)
}

export function addLine(carts: Carts, dish: Dish, modifier = 'Стандартная подача'): Carts {
  const lines = carts[dish.restaurantId]
  const existing = lines.find((line) => line.id === dish.id && (line.modifier || 'Стандартная подача') === modifier)
  const next = existing
    ? lines.map((line) => (line === existing ? { ...line, quantity: line.quantity + 1 } : line))
    : [...lines, { ...dish, modifier, quantity: 1 }]
  return { ...carts, [dish.restaurantId]: next }
}

export function updateLine(carts: Carts, restaurantId: RestaurantId, dishId: string, delta: number, modifier = 'Стандартная подача'): Carts {
  const next = carts[restaurantId]
    .map((line) => (line.id === dishId && (line.modifier || 'Стандартная подача') === modifier ? { ...line, quantity: line.quantity + delta } : line))
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
