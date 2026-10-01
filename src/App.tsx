import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  CreditCard,
  Heart,
  Home,
  MapPin,
  Minus,
  Plus,
  ReceiptText,
  RotateCcw,
  Search,
  ShoppingBag,
  Sparkles,
  Ticket,
  UserRound,
  UsersRound,
  Utensils,
  WalletCards,
  X,
} from 'lucide-react'
import {
  addLine,
  cartTotal,
  dishes,
  emptyCarts,
  findDish,
  findRestaurant,
  parseHash,
  restaurants,
  updateLine,
  type Carts,
  type CartLine,
  type Dish,
  type Restaurant,
  type RestaurantId,
} from './lib'
import { LocationMap } from './LocationMap'
import { bookingDates, brunchOffset, eventDate, formatKrasnodarDate, isFutureBooking, orderSlotLabel, upcomingOrderSlots } from './schedule'

const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`
const deliveryAddresses = {
  krasnaya: 'ул. Красная, 120, Краснодар',
  severnaya: 'ул. Северная, 305, Краснодар',
}
function readProfile(): { name: string; phone: string } {
  try {
    const stored = JSON.parse(localStorage.getItem('chotkie-profile') || '{}')
    return { name: typeof stored.name === 'string' ? stored.name : '', phone: typeof stored.phone === 'string' ? stored.phone : '' }
  } catch { return { name: '', phone: '' } }
}
function deliveryAddress(id?: string | null) {
  const key = id === 'selected' ? 'krasnaya' : id
  return key && key in deliveryAddresses ? deliveryAddresses[key as keyof typeof deliveryAddresses] : null
}

function go(path: string) {
  window.location.hash = path
}

function formatMoney(value: number) {
  return `${new Intl.NumberFormat('ru-RU').format(value)} ₽`
}

function formatGuests(value: number) {
  const lastTwo = value % 100
  const last = value % 10
  const word = lastTwo >= 11 && lastTwo <= 14 ? 'гостей' : last === 1 ? 'гость' : last >= 2 && last <= 4 ? 'гостя' : 'гостей'
  return `${value} ${word}`
}

function readCarts(): Carts {
  try {
    const stored = localStorage.getItem('chotkie-demo-carts')
    return stored ? { ...emptyCarts(), ...JSON.parse(stored) } : emptyCarts()
  } catch {
    return emptyCarts()
  }
}

function readFavorites(): RestaurantId[] {
  try {
    return JSON.parse(localStorage.getItem('chotkie-favorites') || '[]')
  } catch {
    return []
  }
}

type OrderRecord = {
  id: string
  restaurantId: RestaurantId
  createdAt: string
  addressId: string
  time: string
  lines: CartLine[]
  total: number
  payment?: string
}

type PendingOrder = { id: string; restaurantId: RestaurantId; addressId: string; time: string; payment: string }

function beginDemoOrder(restaurantId: RestaurantId, addressId: string, time: string, payment: string) {
  const pending: PendingOrder = { id: crypto.randomUUID(), restaurantId, addressId, time, payment }
  sessionStorage.setItem('chotkie-pending-order', JSON.stringify(pending))
  sessionStorage.removeItem('chotkie-payment-error')
  go(`order-success?restaurant=${restaurantId}&service=delivery&address=${addressId}&time=${time}&id=${pending.id}`)
}

function readOrders(): OrderRecord[] {
  try {
    const value = JSON.parse(localStorage.getItem('chotkie-demo-orders') || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

type BookingState = {
  restaurantId: RestaurantId
  date: string
  time: string
  guests: number
  name: string
  phone: string
}

const initialBooking: BookingState = {
  restaurantId: 'ptichka',
  date: 'Сегодня',
  time: '19:30',
  guests: 2,
  name: '',
  phone: '',
}

function Screen({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <main className={`screen ${className}`}>{children}</main>
}

function BackHeader({ title, overline, action }: { title: string; overline?: string; action?: ReactNode }) {
  return (
    <header className="back-header">
      <button className="icon-button" onClick={() => window.history.back()} aria-label="Назад">
        <ArrowLeft size={20} />
      </button>
      <div className="back-title">
        {overline && <span>{overline}</span>}
        <strong>{title}</strong>
      </div>
      <div className="header-action">{action}</div>
    </header>
  )
}

function BottomNav({ active }: { active: 'home' | 'search' | 'events' | 'card' | 'profile' }) {
  const items = [
    ['home', 'Главная', Home, 'home'],
    ['discover', 'Выбрать', Search, 'search'],
    ['events', 'Афиша', Ticket, 'events'],
    ['loyalty', 'Карта', WalletCards, 'card'],
    ['profile', 'Моё', UserRound, 'profile'],
  ] as const
  return (
    <nav className="bottom-nav" aria-label="Основная навигация">
      {items.map(([route, label, Icon, key]) => (
        <button key={route} className={active === key ? 'active' : ''} onClick={() => go(route)}>
          <Icon size={20} strokeWidth={active === key ? 2.5 : 1.7} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}

function RestaurantVisual({ restaurant, compact = false }: { restaurant: Restaurant; compact?: boolean }) {
  return (
    <div className={`restaurant-visual ${compact ? 'compact' : ''}`}>
      <img src={asset(restaurant.image)} alt={`Интерьер «${restaurant.name}»`} />
      <div className="visual-shade" />
      <div className="visual-copy">
        <span>{restaurant.eyebrow}</span>
        <strong>{restaurant.name}</strong>
        {!compact && <small>{restaurant.description}</small>}
      </div>
    </div>
  )
}

function DishArt({ dish, compact = false }: { dish: Dish; compact?: boolean }) {
  return <img className={`dish-art photo ${compact ? 'compact' : ''}`} src={asset(dish.image)} alt="" loading="lazy" />
}

function HomePage() {
  const moods = [
    ['Свидание', 'Тихо, красиво, на двоих', 'besame'],
    ['С семьёй', 'Сад, солнце и лёгкое меню', 'ptichka'],
    ['Шумный вечер', 'Большая компания и караоке', 'cho'],
    ['Показать город', 'Современная русская кухня', 'katenka'],
  ] as const

  return (
    <>
      <Screen className="home-screen">
        <header className="home-header">
          <div>
            <span className="kicker">Краснодар · вечер</span>
            <h1>Куда пойдём?</h1>
          </div>
          <button className="avatar-button" onClick={() => go('profile')} aria-label="Открыть профиль">
            <UserRound aria-hidden="true" size={21} />
          </button>
        </header>

        <button className="editorial-hero" onClick={() => go('event?id=live-night')}>
          <img src={asset('assets/cho-interior.webp')} alt="Интерьер ресторана «Чо-Чо»" />
          <div className="hero-label">В афише</div>
          <div className="hero-copy">
            <span>Вечер живой музыки</span>
            <h2>Сначала событие.<br />Потом — столик.</h2>
            <span className="round-arrow" aria-hidden="true">
              <ArrowRight size={20} />
            </span>
          </div>
        </button>

        <section className="section-block">
          <div className="section-heading">
            <div>
              <span className="kicker">Выбор по настроению</span>
              <h2>Сегодня хочется</h2>
            </div>
            <button className="text-button" onClick={() => go('discover')}>Все</button>
          </div>
          <div className="mood-grid">
            {moods.map(([label, copy, id]) => {
              const restaurant = findRestaurant(id)
              return (
                <button key={label} className="mood-card" onClick={() => go(`discover?mood=${encodeURIComponent(label)}`)}>
                  <img src={asset(restaurant.image)} alt="" />
                  <span>{label}</span>
                  <small>{copy}</small>
                </button>
              )
            })}
          </div>
        </section>

        <section className="loyalty-strip" onClick={() => go('loyalty')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') go('loyalty') }} role="button" tabIndex={0}>
          <div className="mini-qr"><WalletCards size={30} /></div>
          <div><span>ЧОткая карта</span><strong>Как работает программа</strong><small>Официальные условия и ссылка на карту</small></div>
          <ChevronRight size={20} />
        </section>

        <section className="section-block last-section">
          <div className="section-heading">
            <div><span className="kicker">Быстрое действие</span><h2>Вернуться снова</h2></div>
          </div>
          <button className="history-teaser" onClick={() => go('history')}>
            <div className="history-icon"><RotateCcw size={22} /></div>
            <div><strong>История заказов</strong><span>Ваши оформленные заказы и повтор</span></div>
            <ChevronRight size={20} />
          </button>
        </section>
      </Screen>
      <BottomNav active="home" />
    </>
  )
}

function DiscoverPage({ mood }: { mood?: string | null }) {
  const [loading, setLoading] = useState(true)
  const [selectionValid, setSelectionValid] = useState(true)
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<RestaurantId>(
    mood && ({ 'Свидание': 'besame', 'С семьёй': 'ptichka', 'Шумный вечер': 'cho', 'Показать город': 'katenka' } as Record<string, RestaurantId>)[mood]
      ? ({ 'Свидание': 'besame', 'С семьёй': 'ptichka', 'Шумный вечер': 'cho', 'Показать город': 'katenka' } as Record<string, RestaurantId>)[mood]
      : 'cho',
  )
  useEffect(() => {
    setLoading(true)
    const timer = window.setTimeout(() => setLoading(false), 550)
    return () => window.clearTimeout(timer)
  }, [mood])

  const selections: Record<string, RestaurantId> = {
    'Свидание': 'besame',
    'С семьёй': 'ptichka',
    'Шумный вечер': 'cho',
    'Показать город': 'katenka',
    'Мировая кухня': 'cho',
    'Блюда из птицы': 'ptichka',
    'Русская кухня': 'katenka',
    'Испано-французская': 'besame',
  }
  const visibleRestaurants = mood && selections[mood]
    ? restaurants.filter((restaurant) => restaurant.id === selections[mood])
    : restaurants
  useEffect(() => {
    if (mood && selections[mood]) setSelectedRestaurantId(selections[mood])
  }, [mood])
  const selectedRestaurant = visibleRestaurants.find((item) => item.id === selectedRestaurantId)

  const FilterRow = ({ label, items }: { label: string; items: string[] }) => (
    <div className="filter-group">
      <span>{label}</span>
      <div className="filter-row">
        {items.map((item) => (
          <button key={item} className={mood === item ? 'active' : ''} onClick={() => go(`discover?mood=${encodeURIComponent(item)}`)}>{item}</button>
        ))}
      </div>
    </div>
  )

  return (
    <>
      <Screen className="discover-screen">
        <header className="discover-header">
          <span className="kicker">Не список заведений</span>
          <h1>{mood ? `Настроение: ${mood}` : 'Найти свой вечер'}</h1>
          <p>Выберите повод — приложение покажет подходящую атмосферу, кухню и доступные действия.</p>
        </header>
        <button className={`all-filter ${!mood ? 'active' : ''}`} onClick={() => go('discover')}>Все рестораны</button>
        <FilterRow label="По поводу" items={['Свидание', 'С семьёй', 'Шумный вечер', 'Показать город']} />
        <FilterRow label="По кухне" items={['Мировая кухня', 'Блюда из птицы', 'Русская кухня', 'Испано-французская']} />
        <LocationMap
          points={visibleRestaurants.map((restaurant) => ({
            id: restaurant.id,
            name: restaurant.name,
            address: `Краснодар, ${restaurant.address}`,
            city: 'Краснодар',
            district: restaurant.district,
            meta: restaurant.eyebrow,
            lat: restaurant.lat,
            lng: restaurant.lng,
          }))}
          selectedId={selectedRestaurantId}
          onSelect={(point) => setSelectedRestaurantId(point.id as RestaurantId)}
          title={mood ? `Подходит: ${visibleRestaurants.length}` : 'Все четыре ресторана'}
          onValidityChange={setSelectionValid}
        />
        {loading ? (
          <div className="skeleton-list" aria-label="Загрузка ресторанов">
            {[1, 2, 3].map((item) => <div className="skeleton-card" key={item}><span /><i /><i /></div>)}
          </div>
        ) : (
          <div className="restaurant-list">
            {visibleRestaurants.map((restaurant) => (
              <button className={`restaurant-list-card ${selectedRestaurantId === restaurant.id ? 'selected' : ''}`} key={restaurant.id} onClick={() => setSelectedRestaurantId(restaurant.id)}>
                <span className="list-number">0{restaurants.findIndex((item) => item.id === restaurant.id) + 1}</span>
                <RestaurantVisual restaurant={restaurant} compact />
                <div className="list-meta">
                  <span>{restaurant.moods.join(' · ')}</span>
                  <ChevronRight size={18} />
                </div>
              </button>
            ))}
          </div>
        )}
        <button className="primary-button discover-cta" disabled={!selectedRestaurant || !selectionValid} onClick={() => selectedRestaurant && go(`restaurant?id=${selectedRestaurant.id}`)}>{selectedRestaurant && selectionValid ? `Открыть «${selectedRestaurant.name}»` : 'Выберите ресторан'}</button>
      </Screen>
      <BottomNav active="search" />
    </>
  )
}

function RestaurantPage({ restaurant, saved, onToggleSaved }: { restaurant: Restaurant; saved: boolean; onToggleSaved: () => void }) {
  const primary = restaurant.id === 'besame' ? 'Забронировать для свидания' : 'Забронировать столик'
  return (
    <Screen className="restaurant-page">
      <div className="restaurant-cover">
        <img src={asset(restaurant.image)} alt={`Атмосфера «${restaurant.name}»`} />
        <div className="cover-gradient" />
        <button className="icon-button cover-back" onClick={() => window.history.back()} aria-label="Назад"><ArrowLeft size={20} /></button>
        <button className={`icon-button cover-heart ${saved ? 'saved' : ''}`} onClick={onToggleSaved} aria-label={saved ? 'Убрать из избранного' : 'Добавить в избранное'}><Heart size={20} fill={saved ? 'currentColor' : 'none'} /></button>
        <div className="restaurant-title">
          <span>{restaurant.eyebrow}</span>
          <h1>{restaurant.name}</h1>
          <p><MapPin size={14} /> {restaurant.address}</p>
        </div>
      </div>
      <div className="restaurant-content">
        {saved && <div className="saved-note"><Check size={16} /> Ресторан добавлен в избранное</div>}
        <p className="lead-copy">{restaurant.description}</p>
        <div className="capability-row">
          {restaurant.capabilities.map((capability) => <span key={capability}>{capability}</span>)}
        </div>
        <button className="primary-button" onClick={() => go(`booking?restaurant=${restaurant.id}`)}>
          <CalendarDays size={19} /> {primary}
        </button>
        <div className="action-grid">
          <button onClick={() => go(`menu?restaurant=${restaurant.id}`)}><Utensils /><strong>Меню</strong><span>Посмотреть разделы</span></button>
          {(restaurant.id === 'cho' || restaurant.id === 'besame') ? (
            <button onClick={() => go('events')}><Ticket /><strong>Афиша</strong><span>События и столик</span></button>
          ) : (
            <button onClick={() => go('loyalty')}><WalletCards /><strong>Карта</strong><span>Правила и QR</span></button>
          )}
          {restaurant.ordering ? (
            <button onClick={() => go(`menu?restaurant=${restaurant.id}&mode=order`)}><ShoppingBag /><strong>Заказать</strong><span>Отдельная корзина</span></button>
          ) : (
            <button onClick={() => go(`booking?restaurant=${restaurant.id}&source=visit`)}><Clock3 /><strong>Время</strong><span>Выбрать визит</span></button>
          )}
          <button onClick={() => go(`discover?mood=${encodeURIComponent(restaurant.moods[0])}`)}><Sparkles /><strong>Похожее</strong><span>Другой ресторан</span></button>
        </div>
        {!restaurant.ordering && <p className="availability-note"><CircleAlert size={16} /> Для этого ресторана онлайн-заказ сейчас недоступен.</p>}
      </div>
    </Screen>
  )
}

function Stepper({ value, setValue, min = 1, max = 12 }: { value: number; setValue: (next: number) => void; min?: number; max?: number }) {
  return (
    <div className="stepper">
      <button onClick={() => setValue(Math.max(min, value - 1))} aria-label="Уменьшить"><Minus size={18} /></button>
      <strong>{value}</strong>
      <button onClick={() => setValue(Math.min(max, value + 1))} aria-label="Увеличить"><Plus size={18} /></button>
    </div>
  )
}

function BookingPage({ restaurant, booking, setBooking, source, eventId }: { restaurant: Restaurant; booking: BookingState; setBooking: (next: BookingState) => void; source?: string | null; eventId?: string | null }) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 60_000); return () => window.clearInterval(timer) }, [])
  const eventTime = eventId === 'brunch' ? '11:00' : '19:30'
  const times = source === 'event' ? [eventTime] : ['18:30', '19:00', '19:30', '20:00', '20:30', '21:00']
  const dateOptions = source === 'event' ? [eventDate(eventId, now)] : bookingDates(now)
  const validBooking = isFutureBooking(booking.date, booking.time, now, source === 'event' ? eventId : null)
  useEffect(() => {
    const nextTime = times.includes(booking.time) ? booking.time : times[0]
    const nextDate = dateOptions.includes(booking.date) ? booking.date : dateOptions[0]
    if (nextTime !== booking.time || nextDate !== booking.date || booking.restaurantId !== restaurant.id) setBooking({ ...booking, restaurantId: restaurant.id, time: nextTime, date: nextDate })
  }, [eventId, restaurant.id, source, dateOptions.join("|")])
  return (
    <Screen className="booking-screen">
      <BackHeader title="Столик" overline={restaurant.name} />
      {source === 'event' && <div className="context-note"><Ticket size={17} /><span>Бронирование после события: <strong>«{eventId === 'brunch' ? 'Долгий воскресный завтрак' : 'Живая музыка и ужин'}»</strong></span></div>}
      <RestaurantVisual restaurant={restaurant} compact />
      <section className="booking-block">
        <span className="kicker">01 · день</span>
        <h2>Когда вас ждать?</h2>
        <div className="option-row dates">
          {dateOptions.map((date) => <button key={date} className={booking.date === date ? 'selected' : ''} onClick={() => setBooking({ ...booking, date })}>{date.replace(' ', '\n')}</button>)}
        </div>
      </section>
      <section className="booking-block">
        <span className="kicker">02 · время</span>
        <h2>Свободные интервалы</h2>
        <div className="time-grid">
          {times.map((time) => <button key={time} className={booking.time === time ? 'selected' : ''} disabled={!isFutureBooking(booking.date, time, now, source === 'event' ? eventId : null)} onClick={() => setBooking({ ...booking, time })}>{time}</button>)}
        </div>
        <small className="demo-caption">{source === 'event' ? 'Для события доступно указанное время.' : 'Финальную доступность подтвердит ресторан.'}</small>
      </section>
      <section className="guest-row">
        <div><span className="kicker">03 · компания</span><h2>Количество гостей</h2></div>
        <Stepper value={booking.guests} setValue={(guests) => setBooking({ ...booking, guests })} />
      </section>
      <button className="sticky-primary" disabled={!validBooking} onClick={() => go(`booking-details?restaurant=${restaurant.id}${source === 'event' ? `&source=event&event=${eventId || 'live-night'}` : ''}`)}>Продолжить <ArrowRight size={19} /></button>
    </Screen>
  )
}

function BookingDetailsPage({ restaurant, booking, setBooking, source, eventId }: { restaurant: Restaurant; booking: BookingState; setBooking: (next: BookingState) => void; source?: string | null; eventId?: string | null }) {
  const valid = booking.name.trim().length >= 2 && booking.phone.replace(/\D/g, '').length >= 11
  return (
    <Screen className="form-screen">
      <BackHeader title="Детали брони" overline={restaurant.name} />
      <div className="summary-ticket">
        <div><CalendarDays /><span>{booking.date}</span></div>
        <div><Clock3 /><span>{booking.time}</span></div>
        <div><UsersRound /><span>{formatGuests(booking.guests)}</span></div>
      </div>
      <section className="form-copy"><span className="kicker">Почти готово</span><h1>Кому подтвердить столик?</h1><p>Ресторан использует имя и телефон для подтверждения запроса.</p></section>
      <label className="field"><span>Имя</span><input value={booking.name} onChange={(event) => setBooking({ ...booking, name: event.target.value })} /></label>
      <label className="field"><span>Телефон</span><input value={booking.phone} onChange={(event) => setBooking({ ...booking, phone: event.target.value })} inputMode="tel" /></label>
      <label className="field"><span>Комментарий</span><input placeholder="Например, столик у окна" /></label>
      {!valid && <div className="safe-note"><CircleAlert size={17} /><span>Укажите имя и телефон, чтобы продолжить.</span></div>}
      <button className="sticky-primary" disabled={!valid} onClick={() => go(`booking-success?restaurant=${restaurant.id}${source === 'event' ? `&source=event&event=${eventId || 'live-night'}` : ''}`)}>Отправить запрос</button>
    </Screen>
  )
}

function BookingSuccessPage({ restaurant, booking, source, eventId }: { restaurant: Restaurant; booking: BookingState; source?: string | null; eventId?: string | null }) {
  return (
    <Screen className="result-screen booking-result">
      <div className="success-mark"><Check size={34} /></div>
      <span className="kicker">Запрос отправлен</span>
      <h1>Параметры сохранены</h1>
      <p>Ресторан должен подтвердить столик по указанному телефону.</p>
      <div className="result-card">
        <RestaurantVisual restaurant={restaurant} compact />
        <div className="result-details">
          <span><CalendarDays />{booking.date}</span><span><Clock3 />{booking.time}</span><span><UsersRound />{formatGuests(booking.guests)}</span>
        </div>
      </div>
      <button className="primary-button" onClick={() => go('home')}>На главную</button>
      <button className="secondary-button" onClick={() => go(source === 'event' ? `event?id=${eventId || 'live-night'}` : 'events')}>{source === 'event' ? 'Вернуться к событию' : 'Посмотреть афишу'}</button>
    </Screen>
  )
}

function EventsPage() {
  return (
    <>
      <Screen className="events-screen">
        <header className="events-header"><span className="kicker">Афиша</span><h1>Встречи и события</h1></header>
        <button className="event-feature" onClick={() => go('event?id=live-night')}>
          <img src={asset('assets/cho-interior.webp')} alt="Интерьер «Чо-Чо»" />
          <span className="demo-badge">Идея для афиши</span>
          <div><small>Чо-Чо · {formatKrasnodarDate(3)}, 19:30</small><strong>Живая музыка и ужин</strong><span>Открыть и выбрать столик <ArrowRight size={16} /></span></div>
        </button>
        <div className="event-list">
          <button onClick={() => go('event?id=brunch')}><span className="event-date">+{brunchOffset()}<br /><b>11:00</b></span><div><small>Bésame mucho · {eventDate('brunch')}</small><strong>Долгий воскресный завтрак</strong></div><ChevronRight /></button>
          <div className="empty-event"><Sparkles /><div><strong>Других событий пока нет</strong><span>Вы можете выбрать ресторан и забронировать столик без события.</span></div></div>
        </div>
      </Screen>
      <BottomNav active="events" />
    </>
  )
}

function EventPage({ id }: { id?: string | null }) {
  const isBrunch = id === 'brunch'
  const restaurant = findRestaurant(isBrunch ? 'besame' : 'cho')
  const eventTime = isBrunch ? '11:00' : '19:30'
  const displayDate = eventDate(id)
  return (
    <Screen className="event-page">
      <div className="event-image">
        <img src={asset(isBrunch ? 'assets/besame.webp' : 'assets/cho-interior.webp')} alt="Атмосфера события" />
        <button className="icon-button cover-back" onClick={() => window.history.back()} aria-label="Назад"><ArrowLeft /></button>
        <span className="demo-badge">Идея для афиши</span>
      </div>
      <div className="event-copy">
        <span className="kicker">{restaurant.name} · повод встретиться</span>
        <h1>{isBrunch ? 'Долгий воскресный завтрак' : 'Живая музыка и ужин'}</h1>
        <p>{isBrunch ? 'Неспешный воскресный завтрак. Выберите столик на 11:00.' : 'Ужин под живую музыку. Выберите столик на 19:30.'}</p>
        <div className="event-facts"><span><CalendarDays /> {displayDate}</span><span><Clock3 /> Начало в {eventTime}</span><span><MapPin /> {restaurant.address}</span></div>
        <button className="primary-button" onClick={() => go(`booking?restaurant=${restaurant.id}&source=event&event=${id || 'live-night'}`)}><CalendarDays /> Выбрать столик</button>
        <button className="secondary-button" onClick={() => go(`restaurant?id=${restaurant.id}`)}>О ресторане</button>
      </div>
    </Screen>
  )
}

function MenuPage({ restaurant, mode, category }: { restaurant: Restaurant; mode?: string | null; category?: string | null }) {
  const restaurantDishes = dishes.filter((dish) => dish.restaurantId === restaurant.id)
  const activeCategory = category || 'all'
  const visibleDishes = activeCategory === 'all' ? restaurantDishes : restaurantDishes.filter((dish) => dish.category === activeCategory)
  const categories = (['appetizer', 'hot', 'dessert'] as const).filter((id) => restaurantDishes.some((dish) => dish.category === id))
  const categoryLabels = { appetizer: 'Закуски', hot: 'Горячее', dessert: 'Десерты' }
  const menuRoute = (nextCategory: string) => `menu?restaurant=${restaurant.id}${mode ? `&mode=${mode}` : ''}${nextCategory === 'all' ? '' : `&category=${nextCategory}`}`
  return (
    <Screen className="menu-screen">
      <BackHeader title={mode === 'order' ? 'Заказ' : 'Меню'} overline={restaurant.name} action={<button className="icon-button" onClick={() => go(`cart?restaurant=${restaurant.id}`)} aria-label="Корзина"><ShoppingBag size={19} /></button>} />
      <div className="menu-intro"><span className="kicker">Меню ресторана</span><h1>{restaurant.name}</h1><p>Выберите категорию и откройте состав блюда.</p></div>
      {categories.length > 1 && <div className="menu-tabs"><button className={activeCategory === 'all' ? 'active' : ''} onClick={() => go(menuRoute('all'))}>Все блюда</button>{categories.map((id) => <button key={id} className={activeCategory === id ? 'active' : ''} onClick={() => go(menuRoute(id))}>{categoryLabels[id]}</button>)}</div>}
      {visibleDishes.length > 0 ? (
        <div className="dish-list">
          {visibleDishes.map((dish) => (
            <button key={dish.id} className={`dish-card ${!dish.available ? 'unavailable' : ''}`} onClick={() => go(`dish?restaurant=${restaurant.id}&id=${dish.id}`)}>
              <span className="dish-card-visual"><DishArt dish={dish} compact /></span>
              <div><small>{dish.available ? 'Можно добавить' : 'Сегодня недоступно'}</small><strong>{dish.name}</strong><p>{dish.description}</p><span>{formatMoney(dish.price)}</span></div>
            </button>
          ))}
        </div>
      ) : restaurantDishes.length === 0 ? (
        <div className="menu-readonly"><Utensils size={30} /><h2>Онлайн-заказ недоступен</h2><p>Можно посмотреть ресторан и выбрать столик.</p><button className="primary-button" onClick={() => go(`booking?restaurant=${restaurant.id}`)}>Забронировать столик</button></div>
      ) : (
        <div className="menu-readonly"><Utensils size={30} /><h2>Раздел не найден</h2><p>Откройте все блюда ресторана.</p><button className="primary-button" onClick={() => go(menuRoute('all'))}>Все блюда</button></div>
      )}
    </Screen>
  )
}

function DishPage({ dish, addToCart }: { dish: Dish; addToCart: (dish: Dish, modifier: string) => void }) {
  const restaurant = findRestaurant(dish.restaurantId)
  const [modifier, setModifier] = useState('Стандартная подача')
  return (
    <Screen className="dish-page">
      <div className="dish-hero"><DishArt dish={dish} /><button className="icon-button cover-back" onClick={() => window.history.back()} aria-label="Назад"><ArrowLeft /></button></div>
      <div className={`dish-copy ${dish.presentationOption ? 'has-modifier' : ''}`}><span className="kicker">{restaurant.name} · блюдо</span><h1>{dish.name}</h1><p>{dish.description}</p><div className="dish-price"><strong>{formatMoney(dish.price)}</strong><span>Цена может измениться</span></div>{dish.presentationOption && <><h2>Подача</h2><div className="modifier-row">{['Стандартная подача', dish.presentationOption].map((value) => <button className={modifier === value ? 'active' : ''} key={value} onClick={() => setModifier(value)}>{value}<Check /></button>)}</div></>}</div>
      {dish.available ? <button className="sticky-primary" onClick={() => { addToCart(dish, modifier); go(`cart?restaurant=${dish.restaurantId}`) }}>Добавить в корзину <Plus size={19} /></button> : <button className="sticky-primary disabled" onClick={() => go(`menu?restaurant=${dish.restaurantId}`)}>Выбрать другую позицию</button>}
    </Screen>
  )
}

function CartPage({ restaurant, lines, setQuantity }: { restaurant: Restaurant; lines: Carts[RestaurantId]; setQuantity: (id: string, delta: number, modifier: string) => void }) {
  return (
    <Screen className="cart-screen">
      <BackHeader title="Корзина" overline={restaurant.name} />
      <div className="cart-context"><span style={{ background: restaurant.accent, color: restaurant.text }}>{restaurant.name}</span><p>Только позиции этого ресторана</p></div>
      {lines.length === 0 ? (
        <div className="empty-state"><ShoppingBag /><h1>Корзина пока пуста</h1><p>Добавьте позицию из меню. Выбор ресторана сохранится.</p><button className="primary-button" onClick={() => go(`menu?restaurant=${restaurant.id}&mode=order`)}>Открыть меню</button></div>
      ) : (
        <>
          <div className="cart-lines">{lines.map((line) => <div className="cart-line" key={`${line.id}:${line.modifier}`}><DishArt dish={line} compact /><div><strong>{line.name}</strong><span>{line.modifier || 'Стандартная подача'} · {formatMoney(line.price)}</span></div><Stepper value={line.quantity} setValue={(next) => setQuantity(line.id, next - line.quantity, line.modifier || 'Стандартная подача')} min={0} /></div>)}</div>
          <button className="add-more" onClick={() => go(`menu?restaurant=${restaurant.id}&mode=order`)}><Plus /> Добавить ещё</button>
          <div className="order-total"><span>Итого</span><strong>{formatMoney(cartTotal(lines))}</strong></div>
          <button className="sticky-primary" onClick={() => go(`checkout?restaurant=${restaurant.id}`)}>К оформлению <ArrowRight /></button>
        </>
      )}
    </Screen>
  )
}

function CheckoutPage({ restaurant, lines, addressId, time, edit }: { restaurant: Restaurant; lines: Carts[RestaurantId]; addressId?: string | null; time?: string | null; edit?: string | null }) {
  const [name, setName] = useState(() => sessionStorage.getItem(`chotkie-checkout-name-${restaurant.id}`) || readProfile().name)
  const [phone, setPhone] = useState(() => sessionStorage.getItem(`chotkie-checkout-phone-${restaurant.id}`) || readProfile().phone)
  const [payment, setPayment] = useState(() => sessionStorage.getItem(`chotkie-payment-${restaurant.id}`) || 'Банковская карта')
  const [now, setNow] = useState(() => new Date())
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 60_000); return () => window.clearInterval(timer) }, [])
  const selectedAddressId = addressId === 'selected' ? 'krasnaya' : addressId
  const address = deliveryAddress(addressId)
  const slots = upcomingOrderSlots(now)
  const selectedSlot = slots.find((slot) => slot.id === time)
  const total = cartTotal(lines)
  const validContacts = name.trim().length >= 2 && phone.replace(/\D/g, '').length >= 11
  const route = `checkout?restaurant=${restaurant.id}${address ? `&address=${selectedAddressId}` : ''}${selectedSlot ? `&time=${selectedSlot.id}` : ''}`
  const ready = Boolean(address && selectedSlot && total > 0 && validContacts)
  return (
    <Screen className="checkout-screen">
      <BackHeader title="Оформление" overline={restaurant.name} />
      <section className="checkout-choice"><span className="kicker">Как получить</span><div className="service-option"><MapPin /> Доставка <small>Подтверждена официальным сайтом</small></div></section>
      <button className={`checkout-row ${address ? 'chosen' : ''}`} onClick={() => go(`${route}&edit=address`)}><div><small>Адрес доставки</small><strong>{address || 'Выбрать адрес'}</strong></div>{address ? <Check /> : <ChevronRight />}</button>
      {edit === 'address' && <div className="choice-sheet" role="dialog" aria-label="Выбор адреса"><b>Куда доставить</b>{Object.entries(deliveryAddresses).map(([id, value]) => <button key={id} onClick={() => go(`checkout?restaurant=${restaurant.id}&address=${id}${selectedSlot ? `&time=${selectedSlot.id}` : ''}`)}>{value}{selectedAddressId === id && <Check />}</button>)}</div>}
      <button className={`checkout-row ${selectedSlot ? 'chosen' : ''}`} onClick={() => go(`${route}&edit=time`)}><div><small>Интервал</small><strong>{selectedSlot?.label || 'Выбрать время'}</strong></div>{selectedSlot ? <Check /> : <ChevronRight />}</button>
      {edit === 'time' && <div className="choice-sheet" role="dialog" aria-label="Выбор времени"><b>Доступные интервалы</b>{slots.map((slot) => <button key={slot.id} onClick={() => go(`checkout?restaurant=${restaurant.id}${address ? `&address=${selectedAddressId}` : ''}&time=${slot.id}`)}>{slot.label}{selectedSlot?.id === slot.id && <Check />}</button>)}</div>}
      <button className="checkout-row" onClick={() => go('loyalty')}><div><small>ЧОткая карта</small><strong>Посмотреть условия программы</strong></div><ChevronRight /></button>
      <div className="payment-card"><CreditCard /><div><small>Способ оплаты</small><select value={payment} onChange={(event) => { setPayment(event.target.value); sessionStorage.setItem(`chotkie-payment-${restaurant.id}`, event.target.value) }}><option>Банковская карта</option><option>При получении</option></select></div><Check /></div>
      <section className="checkout-lines"><h2>Состав заказа</h2>{lines.map((line) => <div key={`${line.id}:${line.modifier}`}><DishArt dish={line} compact /><span><b>{line.name}</b><small>{line.modifier || 'Стандартная подача'} · {line.quantity} × {formatMoney(line.price)}</small></span><strong>{formatMoney(line.price * line.quantity)}</strong></div>)}</section>
      <section className="checkout-contacts"><h2>Контакты</h2><label className="field"><span>Имя</span><input value={name} onChange={(event) => { setName(event.target.value); sessionStorage.setItem(`chotkie-checkout-name-${restaurant.id}`, event.target.value) }} /></label><label className="field"><span>Телефон</span><input inputMode="tel" value={phone} onChange={(event) => { setPhone(event.target.value); sessionStorage.setItem(`chotkie-checkout-phone-${restaurant.id}`, event.target.value) }} /></label></section>
      <div className="order-total"><span>К оплате</span><strong>{formatMoney(total)}</strong></div>
      <button className="sticky-primary" disabled={!ready} onClick={() => {
        if (!selectedAddressId || !selectedSlot) return
        if (payment === 'При получении') beginDemoOrder(restaurant.id, selectedAddressId, selectedSlot.id, payment)
        else {
          sessionStorage.setItem('chotkie-payment-error', JSON.stringify({ restaurantId: restaurant.id, addressId: selectedAddressId, time: selectedSlot.id }))
          go(`payment-error?restaurant=${restaurant.id}&service=delivery&address=${selectedAddressId}&time=${selectedSlot.id}`)
        }
      }}>{ready ? payment === 'При получении' ? 'Подтвердить заказ' : 'Перейти к оплате' : 'Заполните адрес, время и контакты'}</button>
    </Screen>
  )
}

function PaymentErrorPage({ restaurant, total, time, addressId }: { restaurant: Restaurant; total: number; time?: string | null; addressId?: string | null }) {
  return (
    <Screen className="result-screen error-result">
      <div className="error-mark"><X size={34} /></div>
      <span className="kicker">Платёж отклонён</span>
      <h1>Оплата не прошла</h1>
      <p>Корзина, ресторан, доставка и выбранное время сохранены.</p>
      <div className="restore-card"><RotateCcw /><div><strong>Можно продолжить без повтора</strong><span>{restaurant.name} · {deliveryAddress(addressId) || 'адрес не выбран'} · {orderSlotLabel(time) || 'время не выбрано'} · {formatMoney(total)}</span></div></div>
      <button className="primary-button" onClick={() => { if (addressId && time) beginDemoOrder(restaurant.id, addressId, time, 'Банковская карта') }}>Повторить оплату</button>
      <button className="secondary-button" onClick={() => go(`cart?restaurant=${restaurant.id}`)}>Вернуться в корзину</button>
    </Screen>
  )
}

function OrderSuccessPage({ restaurant, order, clearCart }: { restaurant: Restaurant; order?: OrderRecord; clearCart: () => void }) {
  if (!order) return <Screen className="result-screen"><div className="empty-state"><ReceiptText /><h1>Заказ не найден</h1><p>Оформите заказ из корзины, чтобы увидеть подтверждение.</p><button className="primary-button" onClick={() => go(`cart?restaurant=${restaurant.id}`)}>Открыть корзину</button></div></Screen>
  return (
    <Screen className="result-screen order-result">
      <div className="success-mark"><Check /></div>
      <span className="kicker">Демонстрационный заказ</span>
      <h1>Заказ сохранён</h1>
      <p>Заказ сохранён в истории этого браузера.</p>
      <div className="receipt"><ReceiptText /><div><small>{restaurant.name}</small><strong>{formatMoney(order.total)}</strong><span>Доставка · {deliveryAddress(order.addressId)} · {orderSlotLabel(order.time)} · {order.payment || 'Оплата не указана'}</span></div></div>
      <button className="primary-button" onClick={() => { clearCart(); go('home') }}>На главную</button>
      <button className="secondary-button" onClick={() => go('history')}>История действий</button>
    </Screen>
  )
}

function UnavailableOrderPage({ restaurant, reason }: { restaurant: Restaurant; reason: string }) {
  return <Screen className="result-screen"><div className="empty-state"><ShoppingBag /><h1>{reason}</h1><p>Выберите блюда, чтобы продолжить заказ.</p><button className="primary-button" onClick={() => go(`menu?restaurant=${restaurant.id}`)}>Открыть меню</button></div></Screen>
}

function LoyaltyPage() {
  return (
    <>
      <Screen className="loyalty-screen">
        <header className="loyalty-header"><span className="kicker">ЧОткая карта</span><h1>Одна карта.<br />Четыре ресторана.</h1><p>Кешбэк и правила программы — на официальном сайте.</p></header>
        <div className="loyalty-card">
          <div className="loyalty-top"><img src={asset('assets/app-icon.webp')} alt="Иконка приложения «ЧОткая карта»" /><span>Программа лояльности</span></div>
          <strong>ЧОткая<br />карта</strong>
          <p className="loyalty-explain">Этот прототип не подключён к личному кабинету. Баланс и код карты можно посмотреть только в официальном сервисе.</p>
          <a className="loyalty-official" href="https://restoran-cho.ru/card" target="_blank" rel="noreferrer">Открыть карту <ArrowRight size={17} /></a>
        </div>
        <section className="rules-card"><h2>Публичные условия</h2><ul><li>Кешбэк растёт от 3% до 10% в зависимости от визитов.</li><li>Бонусами можно оплатить до 20% покупки.</li><li>Накопленные бонусы активны 90 дней и начисляются через 12 часов.</li></ul><a href="https://restoran-cho.ru/card" target="_blank" rel="noreferrer">Официальные правила <ArrowRight size={16} /></a></section>
        <section className="brand-dots"><span>Чо-Чо</span><span>Птичка-Невеличка</span><span>Катенька-Катюша</span><span>Bésame mucho</span></section>
      </Screen>
      <BottomNav active="card" />
    </>
  )
}

function ProfilePage() {
  const [name, setName] = useState(() => readProfile().name)
  const [phone, setPhone] = useState(() => readProfile().phone)
  const [saved, setSaved] = useState(false)
  const valid = name.trim().length >= 2 && phone.replace(/\D/g, '').length >= 11
  return <><Screen className="profile-screen"><header className="history-header"><span className="kicker">Моё</span><h1>Профиль и сохранённые действия</h1></header><section className="profile-form"><label className="field"><span>Имя</span><input value={name} onChange={(event) => { setName(event.target.value); setSaved(false) }} /></label><label className="field"><span>Телефон</span><input inputMode="tel" value={phone} onChange={(event) => { setPhone(event.target.value); setSaved(false) }} placeholder="+7 900 000-00-00" /></label><button className="primary-button" disabled={!valid} onClick={() => { localStorage.setItem('chotkie-profile', JSON.stringify({ name: name.trim(), phone: phone.trim() })); setSaved(true) }}>{saved ? 'Контакты сохранены' : 'Сохранить контакты'}</button></section><section className="profile-actions"><button onClick={() => go('history')}><ReceiptText /><span><b>История</b><small>Заказы и посещения</small></span><ChevronRight /></button><button onClick={() => go('favorites')}><Heart /><span><b>Избранное</b><small>Сохранённые рестораны</small></span><ChevronRight /></button><button onClick={() => go('loyalty')}><WalletCards /><span><b>ЧОткая карта</b><small>Правила и официальный сервис</small></span><ChevronRight /></button></section></Screen><BottomNav active="profile" /></>
}

function FavoritesPage({ favorites }: { favorites: RestaurantId[] }) {
  const savedRestaurants = restaurants.filter((item) => favorites.includes(item.id))
  return <Screen className="history-screen"><BackHeader title="Избранное" overline="Моё" />{savedRestaurants.length ? <div className="restaurant-list">{savedRestaurants.map((restaurant) => <button className="restaurant-list-card" key={restaurant.id} onClick={() => go(`restaurant?id=${restaurant.id}`)}><RestaurantVisual restaurant={restaurant} compact /><div className="list-meta"><span>Открыть ресторан</span><ChevronRight /></div></button>)}</div> : <div className="empty-state"><Heart /><h1>Пока ничего нет</h1><p>Добавьте ресторан сердцем на его странице.</p><button className="primary-button" onClick={() => go('discover')}>Выбрать ресторан</button></div>}</Screen>
}

function HistoryPage({ orders, repeatOrder }: { orders: OrderRecord[]; repeatOrder: (order: OrderRecord) => void }) {
  return (
    <>
      <Screen className="history-screen">
        <header className="history-header"><span className="kicker">Моё</span><h1>История и быстрый возврат</h1></header>
        <section className="history-section"><h2>Заказы</h2>{orders.length ? orders.map((order) => <div className="past-order" key={order.id}><div className="past-top"><span><strong>{findRestaurant(order.restaurantId).name}</strong><small>{new Intl.DateTimeFormat('ru-RU', { timeZone: 'Europe/Moscow', day: 'numeric', month: 'long' }).format(new Date(order.createdAt))} · доставка</small></span><b>{formatMoney(order.total)}</b></div><p><Check /> {order.lines.map((line) => `${line.quantity} × ${line.name}${line.modifier && line.modifier !== 'Стандартная подача' ? ` (${line.modifier.toLowerCase()})` : ''}`).join(', ')}</p><button className="primary-button" onClick={() => repeatOrder(order)}><RotateCcw /> Повторить заказ</button></div>) : <div className="empty-state"><ReceiptText /><h1>Заказов пока нет</h1><p>Когда оформите заказ, он появится здесь.</p><button className="primary-button" onClick={() => go('discover')}>Выбрать ресторан</button></div>}</section>
        <section className="history-section last-section"><h2>Попробовать в следующий раз</h2><button className="visit-card" onClick={() => go('restaurant?id=besame')}><img src={asset('assets/besame.webp')} alt="" /><div><small>Рекомендация другого ресторана</small><strong>Bésame mucho</strong><span>Свидание и долгий завтрак</span></div><ChevronRight /></button></section>
      </Screen>
      <BottomNav active="profile" />
    </>
  )
}

function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="desktop-stage">
      <aside className="stage-copy">
        <span>Инициативная концепция</span>
        <h2>ЧОТКИЕ<br />РЕСТОРАНЫ</h2>
        <p>Выбор по настроению, события и отдельный контекст каждого заведения.</p>
        <a href={`${import.meta.env.BASE_URL}case/`}>Открыть презентацию <ArrowRight size={16} /></a>
      </aside>
      <div className="phone-frame">{children}</div>
    </div>
  )
}

export function App() {
  const [location, setLocation] = useState(() => parseHash(window.location.hash))
  const [carts, setCarts] = useState<Carts>(readCarts)
  const [booking, setBookingState] = useState<BookingState>(() => ({ ...initialBooking, ...readProfile() }))
  const [favorites, setFavorites] = useState<RestaurantId[]>(readFavorites)
  const [orders, setOrders] = useState<OrderRecord[]>(readOrders)

  useEffect(() => {
    if (!window.location.hash) go('home')
    const onHash = () => setLocation(parseHash(window.location.hash))
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => localStorage.setItem('chotkie-demo-carts', JSON.stringify(carts)), [carts])
  useEffect(() => localStorage.setItem('chotkie-favorites', JSON.stringify(favorites)), [favorites])
  useEffect(() => localStorage.setItem('chotkie-demo-orders', JSON.stringify(orders)), [orders])
  useEffect(() => {
    window.scrollTo({ top: 0 })
    document.querySelector('.phone-frame > .screen')?.scrollTo({ top: 0 })
  }, [location.route, location.params.toString()])

  const restaurant = useMemo(() => findRestaurant(location.params.get('restaurant') || location.params.get('id')), [location])
  const dish = useMemo(() => findDish(location.params.get('id')), [location])

  useEffect(() => {
    if (location.route !== 'order-success') return
    const id = location.params.get('id')
    const addressId = location.params.get('address')
    const time = location.params.get('time')
    const lines = carts[restaurant.id]
    let pending: PendingOrder | null = null
    try { pending = JSON.parse(sessionStorage.getItem('chotkie-pending-order') || 'null') } catch { /* invalid pending data cannot confirm an order */ }
    if (!id || pending?.id !== id || pending.restaurantId !== restaurant.id || pending.addressId !== addressId || pending.time !== time || !deliveryAddress(addressId) || !orderSlotLabel(time) || !lines.length) return
    setOrders((current) => current.some((order) => order.id === id) ? current : [{ id, restaurantId: restaurant.id, createdAt: new Date().toISOString(), addressId: addressId!, time: time!, lines, total: cartTotal(lines), payment: pending.payment }, ...current])
    sessionStorage.removeItem('chotkie-pending-order')
  }, [location, carts, restaurant.id])

  function addToCart(nextDish: Dish, modifier: string) {
    setCarts((current) => addLine(current, nextDish, modifier))
  }

  function setBooking(next: BookingState) {
    setBookingState(next)
  }

  function repeatOrder(order: OrderRecord) {
    let next: Carts = { ...carts, [order.restaurantId]: [] }
    for (const line of order.lines) {
      const currentDish = dishes.find((item) => item.id === line.id && item.restaurantId === order.restaurantId && item.available)
      if (!currentDish) continue
      for (let count = 0; count < line.quantity; count += 1) next = addLine(next, currentDish, line.modifier || 'Стандартная подача')
    }
    setCarts(next)
    go(`cart?restaurant=${order.restaurantId}&repeat=1`)
  }

  let paymentErrorActive = false
  try {
    const pending = JSON.parse(sessionStorage.getItem('chotkie-payment-error') || 'null')
    paymentErrorActive = pending?.restaurantId === restaurant.id && pending?.addressId === location.params.get('address') && pending?.time === location.params.get('time')
  } catch { /* invalid stored data cannot open payment recovery */ }

  let page: ReactNode
  switch (location.route) {
    case 'discover': page = <DiscoverPage mood={location.params.get('mood')} />; break
    case 'restaurant': page = <RestaurantPage restaurant={restaurant} saved={favorites.includes(restaurant.id)} onToggleSaved={() => setFavorites((current) => current.includes(restaurant.id) ? current.filter((id) => id !== restaurant.id) : [...current, restaurant.id])} />; break
    case 'booking': page = <BookingPage restaurant={restaurant} booking={{ ...booking, restaurantId: restaurant.id }} setBooking={setBooking} source={location.params.get('source')} eventId={location.params.get('event')} />; break
    case 'booking-details': page = <BookingDetailsPage restaurant={restaurant} booking={{ ...booking, restaurantId: restaurant.id }} setBooking={setBooking} source={location.params.get('source')} eventId={location.params.get('event')} />; break
    case 'booking-success': page = <BookingSuccessPage restaurant={restaurant} booking={booking} source={location.params.get('source')} eventId={location.params.get('event')} />; break
    case 'events': page = <EventsPage />; break
    case 'event': page = <EventPage id={location.params.get('id')} />; break
    case 'menu': page = <MenuPage restaurant={restaurant} mode={location.params.get('mode')} category={location.params.get('category')} />; break
    case 'dish': page = <DishPage dish={dish} addToCart={addToCart} />; break
    case 'cart': page = <CartPage restaurant={restaurant} lines={carts[restaurant.id]} setQuantity={(id, delta, modifier) => setCarts((current) => updateLine(current, restaurant.id, id, delta, modifier))} />; break
    case 'checkout': page = carts[restaurant.id].length ? <CheckoutPage restaurant={restaurant} lines={carts[restaurant.id]} addressId={location.params.get('address')} time={location.params.get('time')} edit={location.params.get('edit')} /> : <UnavailableOrderPage restaurant={restaurant} reason="Корзина пока пуста" />; break
    case 'payment-error': page = carts[restaurant.id].length && paymentErrorActive ? <PaymentErrorPage restaurant={restaurant} total={cartTotal(carts[restaurant.id])} time={location.params.get('time')} addressId={location.params.get('address')} /> : <UnavailableOrderPage restaurant={restaurant} reason="Оплата не начиналась" />; break
    case 'order-success': page = <OrderSuccessPage restaurant={restaurant} order={orders.find((order) => order.id === location.params.get('id'))} clearCart={() => setCarts((current) => ({ ...current, [restaurant.id]: [] }))} />; break
    case 'loyalty': page = <LoyaltyPage />; break
    case 'history': page = <HistoryPage orders={orders} repeatOrder={repeatOrder} />; break
    case 'profile': page = <ProfilePage />; break
    case 'favorites': page = <FavoritesPage favorites={favorites} />; break
    default: page = <HomePage />
  }

  return <AppShell>{page}</AppShell>
}
