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
  QrCode,
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
  type Dish,
  type Restaurant,
  type RestaurantId,
} from './lib'
import { LocationMap } from './LocationMap'

const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`

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

function formatKrasnodarDate(offsetDays: number) {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() + offsetDays)
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', timeZone: 'Europe/Moscow' }).format(date)
}

const bookingDates = ['Сегодня', 'Завтра', formatKrasnodarDate(2)]

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
  name: 'Алексей',
  phone: '+7 900 000-00-00',
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
  return <div className={`dish-art ${dish.restaurantId} ${compact ? 'compact' : ''}`} aria-label={`Иллюстрация блюда «${dish.name}»`}><span><Utensils /></span><i /><i /></div>
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
            А
          </button>
        </header>

        <button className="editorial-hero" onClick={() => go('event?id=live-night')}>
          <img src={asset('assets/cho-interior.webp')} alt="Интерьер ресторана «Чо-Чо»" />
          <div className="hero-label">Сценарий события</div>
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

        <section className="loyalty-strip" onClick={() => go('loyalty')} role="button" tabIndex={0}>
          <div className="mini-qr"><QrCode size={32} /></div>
          <div><span>ЧОткая карта</span><strong>Карта всегда под рукой</strong><small>Общие правила четырёх ресторанов</small></div>
          <ChevronRight size={20} />
        </section>

        <section className="section-block last-section">
          <div className="section-heading">
            <div><span className="kicker">Быстрое действие</span><h2>Вернуться снова</h2></div>
          </div>
          <button className="history-teaser" onClick={() => go('history')}>
            <div className="history-icon"><RotateCcw size={22} /></div>
            <div><strong>Повторить заказ из «Чо-Чо»</strong><span>Сначала проверим цену и доступность</span></div>
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
        {!restaurant.ordering && <p className="availability-note"><CircleAlert size={16} /> Доставка в концепции показывается только там, где она подтверждена публичным сайтом.</p>}
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
  const eventTime = eventId === 'brunch' ? '11:00' : '19:30'
  const times = source === 'event' ? [eventTime] : ['18:30', '19:00', '19:30', '20:00', '20:30', '21:00']
  useEffect(() => {
    const nextTime = times.includes(booking.time) ? booking.time : times[0]
    const nextDate = bookingDates.includes(booking.date) ? booking.date : bookingDates[0]
    if (nextTime !== booking.time || nextDate !== booking.date || booking.restaurantId !== restaurant.id) setBooking({ ...booking, restaurantId: restaurant.id, time: nextTime, date: nextDate })
  }, [eventId, restaurant.id, source])
  return (
    <Screen className="booking-screen">
      <BackHeader title="Столик" overline={restaurant.name} />
      {source === 'event' && <div className="context-note"><Ticket size={17} /><span>Бронирование после события: <strong>«{eventId === 'brunch' ? 'Долгий воскресный завтрак' : 'Живая музыка и ужин'}»</strong></span></div>}
      <RestaurantVisual restaurant={restaurant} compact />
      <section className="booking-block">
        <span className="kicker">01 · день</span>
        <h2>Когда вас ждать?</h2>
        <div className="option-row dates">
          {bookingDates.map((date) => <button key={date} className={booking.date === date ? 'selected' : ''} onClick={() => setBooking({ ...booking, date })}>{date.replace(' ', '\n')}</button>)}
        </div>
      </section>
      <section className="booking-block">
        <span className="kicker">02 · время</span>
        <h2>Свободные интервалы</h2>
        <div className="time-grid">
          {times.map((time) => <button key={time} className={booking.time === time ? 'selected' : ''} onClick={() => setBooking({ ...booking, time })}>{time}</button>)}
        </div>
        <small className="demo-caption">{source === 'event' ? 'Время закреплено за сценарием события.' : 'Финальную доступность подтвердит ресторан.'}</small>
      </section>
      <section className="guest-row">
        <div><span className="kicker">03 · компания</span><h2>Количество гостей</h2></div>
        <Stepper value={booking.guests} setValue={(guests) => setBooking({ ...booking, guests })} />
      </section>
      <button className="sticky-primary" onClick={() => go(`booking-details?restaurant=${restaurant.id}${source === 'event' ? `&source=event&event=${eventId || 'live-night'}` : ''}`)}>Продолжить <ArrowRight size={19} /></button>
    </Screen>
  )
}

function BookingDetailsPage({ restaurant, booking, setBooking, source, eventId }: { restaurant: Restaurant; booking: BookingState; setBooking: (next: BookingState) => void; source?: string | null; eventId?: string | null }) {
  const valid = booking.name.trim().length >= 2 && booking.phone.replace(/\D/g, '').length >= 6
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
        <header className="events-header"><span className="kicker">Афиша</span><h1>Событие — это повод выбрать ресторан</h1></header>
        <button className="event-feature" onClick={() => go('event?id=live-night')}>
          <img src={asset('assets/cho-interior.webp')} alt="Интерьер «Чо-Чо»" />
          <span className="demo-badge">Сценарное событие</span>
          <div><small>Чо-Чо · {formatKrasnodarDate(3)}, 19:30</small><strong>Живая музыка и ужин</strong><span>Открыть и выбрать столик <ArrowRight size={16} /></span></div>
        </button>
        <div className="event-list">
          <button onClick={() => go('event?id=brunch')}><span className="event-date">+4<br /><b>11:00</b></span><div><small>Bésame mucho · {formatKrasnodarDate(4)}</small><strong>Долгий воскресный завтрак</strong></div><ChevronRight /></button>
          <div className="empty-event"><Sparkles /><div><strong>Новых анонсов пока нет</strong><span>Пустое состояние сохраняет доступ к ресторанам и бронированию.</span></div></div>
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
  const eventDate = formatKrasnodarDate(isBrunch ? 4 : 3)
  return (
    <Screen className="event-page">
      <div className="event-image">
        <img src={asset(isBrunch ? 'assets/besame.webp' : 'assets/cho-interior.webp')} alt="Атмосфера события" />
        <button className="icon-button cover-back" onClick={() => window.history.back()} aria-label="Назад"><ArrowLeft /></button>
        <span className="demo-badge">Сценарное событие</span>
      </div>
      <div className="event-copy">
        <span className="kicker">{restaurant.name} · повод встретиться</span>
        <h1>{isBrunch ? 'Долгий воскресный завтрак' : 'Живая музыка и ужин'}</h1>
        <p>{isBrunch ? 'Неспешный завтрак с отдельным столиком и фиксированным временем начала.' : 'Вечерний ужин с живой музыкой и фиксированным временем начала.'}</p>
        <div className="event-facts"><span><CalendarDays /> {eventDate}</span><span><Clock3 /> Начало в {eventTime}</span><span><MapPin /> {restaurant.address}</span></div>
        <button className="primary-button" onClick={() => go(`booking?restaurant=${restaurant.id}&source=event&event=${id || 'live-night'}`)}><CalendarDays /> Выбрать столик</button>
        <button className="secondary-button" onClick={() => go(`restaurant?id=${restaurant.id}`)}>О ресторане</button>
      </div>
    </Screen>
  )
}

function MenuPage({ restaurant, mode, category }: { restaurant: Restaurant; mode?: string | null; category?: string | null }) {
  const restaurantDishes = dishes.filter((dish) => dish.restaurantId === restaurant.id)
  const activeCategory = category || 'popular'
  const visibleDishes = activeCategory === 'drinks' ? [] : restaurantDishes
  const menuRoute = (nextCategory: string) => `menu?restaurant=${restaurant.id}${mode ? `&mode=${mode}` : ''}${nextCategory === 'popular' ? '' : `&category=${nextCategory}`}`
  return (
    <Screen className="menu-screen">
      <BackHeader title={mode === 'order' ? 'Заказ' : 'Меню'} overline={restaurant.name} action={<button className="icon-button" onClick={() => go(`cart?restaurant=${restaurant.id}`)} aria-label="Корзина"><ShoppingBag size={19} /></button>} />
      <div className="menu-intro"><span className="kicker">Меню ресторана</span><h1>{restaurant.name}</h1><p>Выберите категорию и откройте состав блюда.</p></div>
      <div className="menu-tabs"><button className={activeCategory === 'popular' ? 'active' : ''} onClick={() => go(menuRoute('popular'))}>Популярное</button><button className={activeCategory === 'main' ? 'active' : ''} onClick={() => go(menuRoute('main'))}>Основное</button><button className={activeCategory === 'drinks' ? 'active' : ''} onClick={() => go(menuRoute('drinks'))}>Напитки</button></div>
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
        <div className="menu-readonly"><Utensils size={30} /><h2>Меню для просмотра</h2><p>Заказ для этого ресторана не заявлен в концепции без публичного подтверждения сценария.</p><button className="primary-button" onClick={() => go(`booking?restaurant=${restaurant.id}`)}>Забронировать столик</button></div>
      ) : (
        <div className="menu-readonly"><Utensils size={30} /><h2>В этой категории пока пусто</h2><p>Выберите другой раздел меню ресторана.</p><button className="primary-button" onClick={() => go(menuRoute('popular'))}>Вернуться к популярному</button></div>
      )}
    </Screen>
  )
}

function DishPage({ dish, addToCart }: { dish: Dish; addToCart: (dish: Dish) => void }) {
  const restaurant = findRestaurant(dish.restaurantId)
  const [modifier, setModifier] = useState('Стандартная подача')
  return (
    <Screen className="dish-page">
      <div className="dish-hero"><DishArt dish={dish} /><button className="icon-button cover-back" onClick={() => window.history.back()} aria-label="Назад"><ArrowLeft /></button></div>
      <div className="dish-copy"><span className="kicker">{restaurant.name} · блюдо</span><h1>{dish.name}</h1><p>{dish.description}</p><div className="dish-price"><strong>{formatMoney(dish.price)}</strong><span>Цена может измениться</span></div><h2>Подача</h2><div className="modifier-row">{['Стандартная подача', 'Без соуса'].map((value) => <button className={modifier === value ? 'active' : ''} key={value} onClick={() => setModifier(value)}>{value}<Check /></button>)}</div></div>
      {dish.available ? <button className="sticky-primary" onClick={() => { addToCart(dish); go(`cart?restaurant=${dish.restaurantId}`) }}>Добавить в корзину <Plus size={19} /></button> : <button className="sticky-primary disabled" onClick={() => go(`menu?restaurant=${dish.restaurantId}`)}>Выбрать другую позицию</button>}
    </Screen>
  )
}

function CartPage({ restaurant, lines, setQuantity }: { restaurant: Restaurant; lines: Carts[RestaurantId]; setQuantity: (id: string, delta: number) => void }) {
  return (
    <Screen className="cart-screen">
      <BackHeader title="Корзина" overline={restaurant.name} />
      <div className="cart-context"><span style={{ background: restaurant.accent, color: restaurant.text }}>{restaurant.name}</span><p>Только позиции этого ресторана</p></div>
      {lines.length === 0 ? (
        <div className="empty-state"><ShoppingBag /><h1>Корзина пока пуста</h1><p>Добавьте позицию из меню. Выбор ресторана сохранится.</p><button className="primary-button" onClick={() => go(`menu?restaurant=${restaurant.id}&mode=order`)}>Открыть меню</button></div>
      ) : (
        <>
          <div className="cart-lines">{lines.map((line) => <div className="cart-line" key={line.id}><DishArt dish={line} compact /><div><strong>{line.name}</strong><span>{formatMoney(line.price)}</span></div><Stepper value={line.quantity} setValue={(next) => setQuantity(line.id, next - line.quantity)} min={0} /></div>)}</div>
          <button className="add-more" onClick={() => go(`menu?restaurant=${restaurant.id}&mode=order`)}><Plus /> Добавить ещё</button>
          <div className="order-total"><span>Итого</span><strong>{formatMoney(cartTotal(lines))}</strong></div>
          <button className="sticky-primary" onClick={() => go(`checkout?restaurant=${restaurant.id}`)}>К оформлению <ArrowRight /></button>
        </>
      )}
    </Screen>
  )
}

function CheckoutPage({ restaurant, lines, addressSelected, time, edit }: { restaurant: Restaurant; lines: Carts[RestaurantId]; addressSelected: boolean; time?: string | null; edit?: string | null }) {
  const [name, setName] = useState('Алексей')
  const [phone, setPhone] = useState('+7 900 000-00-00')
  const [payment, setPayment] = useState('Карта •• 2481')
  const selectedTime = time === '1930'
  const total = cartTotal(lines)
  const validContacts = name.trim().length >= 2 && phone.replace(/\D/g, '').length >= 6
  const route = `checkout?restaurant=${restaurant.id}${addressSelected ? '&address=selected' : ''}${selectedTime ? '&time=1930' : ''}`
  const ready = addressSelected && selectedTime && total > 0 && validContacts
  return (
    <Screen className="checkout-screen">
      <BackHeader title="Оформление" overline={restaurant.name} />
      <section className="checkout-choice"><span className="kicker">Как получить</span><div className="service-option"><MapPin /> Доставка <small>Подтверждена официальным сайтом</small></div></section>
      <button className={`checkout-row ${addressSelected ? 'chosen' : ''}`} onClick={() => go(`${route}&edit=address`)}><div><small>Адрес доставки</small><strong>{addressSelected ? 'ул. Красная, 120, Краснодар' : 'Выбрать адрес'}</strong></div>{addressSelected ? <Check /> : <ChevronRight />}</button>
      {edit === 'address' && <div className="choice-sheet" role="dialog" aria-label="Выбор адреса"><b>Куда доставить</b>{['ул. Красная, 120, Краснодар', 'ул. Северная, 305, Краснодар'].map((value) => <button key={value} onClick={() => go(`checkout?restaurant=${restaurant.id}&address=selected${selectedTime ? '&time=1930' : ''}`)}>{value}<Check /></button>)}</div>}
      <button className={`checkout-row ${selectedTime ? 'chosen' : ''}`} onClick={() => go(`${route}&edit=time`)}><div><small>Интервал</small><strong>{selectedTime ? 'Сегодня, 19:30–20:00' : 'Выбрать время'}</strong></div>{selectedTime ? <Check /> : <ChevronRight />}</button>
      {edit === 'time' && <div className="choice-sheet" role="dialog" aria-label="Выбор времени"><b>Доступные интервалы</b>{['Сегодня, 19:30–20:00', 'Сегодня, 20:00–20:30'].map((value) => <button key={value} onClick={() => go(`checkout?restaurant=${restaurant.id}${addressSelected ? '&address=selected' : ''}&time=1930`)}>{value}<Check /></button>)}</div>}
      <button className="checkout-row" onClick={() => go('loyalty')}><div><small>ЧОткая карта</small><strong>Начислить бонусы</strong></div><ChevronRight /></button>
      <div className="payment-card"><CreditCard /><div><small>Способ оплаты</small><select value={payment} onChange={(event) => setPayment(event.target.value)}><option>Карта •• 2481</option><option>При получении</option></select></div><Check /></div>
      <section className="checkout-lines"><h2>Состав заказа</h2>{lines.map((line) => <div key={line.id}><DishArt dish={line} compact /><span><b>{line.name}</b><small>{line.quantity} × {formatMoney(line.price)}</small></span><strong>{formatMoney(line.price * line.quantity)}</strong></div>)}</section>
      <section className="checkout-contacts"><h2>Контакты</h2><label className="field"><span>Имя</span><input value={name} onChange={(event) => setName(event.target.value)} /></label><label className="field"><span>Телефон</span><input inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} /></label></section>
      <div className="order-total"><span>К оплате</span><strong>{formatMoney(total)}</strong></div>
      <button className="sticky-primary" disabled={!ready} onClick={() => go(`payment-error?restaurant=${restaurant.id}&service=delivery&address=selected&time=1930`)}>{ready ? 'Перейти к оплате' : 'Заполните адрес, время и контакты'}</button>
    </Screen>
  )
}

function PaymentErrorPage({ restaurant, total, time }: { restaurant: Restaurant; total: number; time?: string | null }) {
  const displayTotal = total || 1880
  return (
    <Screen className="result-screen error-result">
      <div className="error-mark"><X size={34} /></div>
      <span className="kicker">Платёж отклонён</span>
      <h1>Оплата не прошла</h1>
      <p>Корзина, ресторан, доставка и выбранное время сохранены.</p>
      <div className="restore-card"><RotateCcw /><div><strong>Можно продолжить без повтора</strong><span>{restaurant.name} · доставка в {time === '1930' ? '19:30' : 'выбранное время'} · {formatMoney(displayTotal)}</span></div></div>
      <button className="primary-button" onClick={() => go(`order-success?restaurant=${restaurant.id}&service=delivery&time=${time || '1930'}`)}>Повторить оплату</button>
      <button className="secondary-button" onClick={() => go(`cart?restaurant=${restaurant.id}`)}>Вернуться в корзину</button>
    </Screen>
  )
}

function OrderSuccessPage({ restaurant, total, time, clearCart }: { restaurant: Restaurant; total: number; time?: string | null; clearCart: () => void }) {
  return (
    <Screen className="result-screen order-result">
      <div className="success-mark"><Check /></div>
      <span className="kicker">Оплата принята</span>
      <h1>Заказ подтверждён</h1>
      <p>Корзина восстановлена после ошибки, заказ сохранён в истории.</p>
      <div className="receipt"><ReceiptText /><div><small>{restaurant.name}</small><strong>{formatMoney(total)}</strong><span>Доставка · сегодня, {time === '1930' ? '19:30' : 'выбранное время'}</span></div></div>
      <button className="primary-button" onClick={() => { clearCart(); go('home') }}>На главную</button>
      <button className="secondary-button" onClick={() => go('history')}>История действий</button>
    </Screen>
  )
}

function LoyaltyPage() {
  return (
    <>
      <Screen className="loyalty-screen">
        <header className="loyalty-header"><span className="kicker">ЧОткая карта</span><h1>Одна карта.<br />Четыре ресторана.</h1><p>Подтверждено публичными страницами программы лояльности.</p></header>
        <div className="loyalty-card">
          <div className="loyalty-top"><img src={asset('assets/app-icon.webp')} alt="Иконка приложения «ЧОткая карта»" /><span>Баланс карты</span></div>
          <strong>860 <small>бонусов</small></strong>
          <div className="qr-large"><QrCode size={86} /><span>Код карты</span></div>
          <div className="card-bottom"><span>1 бонус = 1 рубль</span><span>Уровень · базовый</span></div>
        </div>
        <section className="rules-card"><h2>Публичные условия</h2><ul><li>Кешбэк растёт от 3% до 10% в зависимости от визитов.</li><li>Бонусами можно оплатить до 20% покупки.</li><li>Накопленные бонусы активны 90 дней и начисляются через 12 часов.</li></ul><a href="https://restoran-cho.ru/card" target="_blank" rel="noreferrer">Официальные правила <ArrowRight size={16} /></a></section>
        <section className="brand-dots"><span>Чо-Чо</span><span>Птичка-Невеличка</span><span>Катенька-Катюша</span><span>Bésame mucho</span></section>
      </Screen>
      <BottomNav active="card" />
    </>
  )
}

function ProfilePage() {
  const [name, setName] = useState('Алексей')
  const [phone, setPhone] = useState('+7 900 000-00-00')
  const [saved, setSaved] = useState(false)
  const valid = name.trim().length >= 2 && phone.replace(/\D/g, '').length >= 6
  return <><Screen className="profile-screen"><header className="history-header"><span className="kicker">Моё</span><h1>Профиль и сохранённые действия</h1></header><section className="profile-form"><label className="field"><span>Имя</span><input value={name} onChange={(event) => { setName(event.target.value); setSaved(false) }} /></label><label className="field"><span>Телефон</span><input inputMode="tel" value={phone} onChange={(event) => { setPhone(event.target.value); setSaved(false) }} /></label><button className="primary-button" disabled={!valid} onClick={() => setSaved(true)}>{saved ? 'Контакты сохранены' : 'Сохранить контакты'}</button></section><section className="profile-actions"><button onClick={() => go('history')}><ReceiptText /><span><b>История</b><small>Заказы и посещения</small></span><ChevronRight /></button><button onClick={() => go('favorites')}><Heart /><span><b>Избранное</b><small>Сохранённые рестораны</small></span><ChevronRight /></button><button onClick={() => go('loyalty')}><WalletCards /><span><b>ЧОткая карта</b><small>Баланс и правила</small></span><ChevronRight /></button></section></Screen><BottomNav active="profile" /></>
}

function FavoritesPage({ favorites }: { favorites: RestaurantId[] }) {
  const savedRestaurants = restaurants.filter((item) => favorites.includes(item.id))
  return <Screen className="history-screen"><BackHeader title="Избранное" overline="Моё" />{savedRestaurants.length ? <div className="restaurant-list">{savedRestaurants.map((restaurant) => <button className="restaurant-list-card" key={restaurant.id} onClick={() => go(`restaurant?id=${restaurant.id}`)}><RestaurantVisual restaurant={restaurant} compact /><div className="list-meta"><span>Открыть ресторан</span><ChevronRight /></div></button>)}</div> : <div className="empty-state"><Heart /><h1>Пока ничего нет</h1><p>Добавьте ресторан сердцем на его странице.</p><button className="primary-button" onClick={() => go('discover')}>Выбрать ресторан</button></div>}</Screen>
}

function HistoryPage({ repeatOrder }: { repeatOrder: () => void }) {
  return (
    <>
      <Screen className="history-screen">
        <header className="history-header"><span className="kicker">Моё</span><h1>История и быстрый возврат</h1></header>
        <section className="history-section"><h2>Недавний заказ</h2><div className="past-order"><div className="past-top"><span><strong>Чо-Чо</strong><small>{formatKrasnodarDate(-4)} · доставка</small></span><b>1 880 ₽</b></div><p><Check /> Доступность и цена проверяются перед повтором</p><button className="primary-button" onClick={repeatOrder}><RotateCcw /> Повторить заказ</button></div></section>
        <section className="history-section"><h2>Посещения</h2><button className="visit-card" onClick={() => go('restaurant?id=ptichka')}><img src={asset('assets/ptichka.webp')} alt="" /><div><small>{formatKrasnodarDate(-8)} · 2 гостя</small><strong>Птичка-Невеличка</strong><span>Посмотреть ресторан снова</span></div><ChevronRight /></button></section>
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
  const [booking, setBookingState] = useState<BookingState>(initialBooking)
  const [favorites, setFavorites] = useState<RestaurantId[]>(readFavorites)

  useEffect(() => {
    if (!window.location.hash) go('home')
    const onHash = () => setLocation(parseHash(window.location.hash))
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => localStorage.setItem('chotkie-demo-carts', JSON.stringify(carts)), [carts])
  useEffect(() => localStorage.setItem('chotkie-favorites', JSON.stringify(favorites)), [favorites])
  useEffect(() => {
    window.scrollTo({ top: 0 })
    document.querySelector('.phone-frame')?.scrollTo({ top: 0 })
    if (/^(15|16|17) августа$/i.test(booking.date)) setBookingState({ ...booking, date: bookingDates[0] })
  }, [location.route, location.params.toString()])

  const restaurant = useMemo(() => findRestaurant(location.params.get('restaurant') || location.params.get('id')), [location])
  const dish = useMemo(() => findDish(location.params.get('id')), [location])

  useEffect(() => {
    if (location.route !== 'payment-error' || carts[restaurant.id].length > 0) return
    const available = dishes.filter((item) => item.restaurantId === restaurant.id && item.available)
    let seeded = carts
    available.forEach((item) => { seeded = addLine(seeded, item) })
    setCarts(seeded)
  }, [carts, location, restaurant.id])

  function addToCart(nextDish: Dish) {
    setCarts((current) => addLine(current, nextDish))
  }

  function setBooking(next: BookingState) {
    setBookingState(next)
  }

  function repeatOrder() {
    const choDishes = dishes.filter((item) => item.restaurantId === 'cho' && item.available)
    let next: Carts = { ...carts, cho: [] }
    choDishes.forEach((item) => { next = addLine(next, item) })
    setCarts(next)
    go('cart?restaurant=cho&repeat=1')
  }

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
    case 'cart': page = <CartPage restaurant={restaurant} lines={carts[restaurant.id]} setQuantity={(id, delta) => setCarts((current) => updateLine(current, restaurant.id, id, delta))} />; break
    case 'checkout': page = <CheckoutPage restaurant={restaurant} lines={carts[restaurant.id]} addressSelected={location.params.get('address') === 'selected'} time={location.params.get('time')} edit={location.params.get('edit')} />; break
    case 'payment-error': page = <PaymentErrorPage restaurant={restaurant} total={cartTotal(carts[restaurant.id])} time={location.params.get('time')} />; break
    case 'order-success': page = <OrderSuccessPage restaurant={restaurant} total={cartTotal(carts[restaurant.id])} time={location.params.get('time')} clearCart={() => setCarts((current) => ({ ...current, [restaurant.id]: [] }))} />; break
    case 'loyalty': page = <LoyaltyPage />; break
    case 'history': page = <HistoryPage repeatOrder={repeatOrder} />; break
    case 'profile': page = <ProfilePage />; break
    case 'favorites': page = <FavoritesPage favorites={favorites} />; break
    default: page = <HomePage />
  }

  return <AppShell>{page}</AppShell>
}
