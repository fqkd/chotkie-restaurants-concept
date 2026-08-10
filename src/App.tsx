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

const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`

function go(path: string) {
  window.location.hash = path
}

function formatMoney(value: number) {
  return `${new Intl.NumberFormat('ru-RU').format(value)} ₽`
}

function readCarts(): Carts {
  try {
    const stored = localStorage.getItem('chotkie-demo-carts')
    return stored ? { ...emptyCarts(), ...JSON.parse(stored) } : emptyCarts()
  } catch {
    return emptyCarts()
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
  date: '15 августа',
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
    ['history', 'Моё', UserRound, 'profile'],
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
          <button className="avatar-button" onClick={() => go('history')} aria-label="История и профиль">
            А
          </button>
        </header>

        <section className="editorial-hero" onClick={() => go('event?id=live-night')} role="button" tabIndex={0}>
          <img src={asset('assets/cho-interior.webp')} alt="Интерьер ресторана «Чо-Чо»" />
          <div className="hero-label">Афиша · демосценарий</div>
          <div className="hero-copy">
            <span>Вечер живой музыки</span>
            <h2>Сначала событие.<br />Потом — столик.</h2>
            <button className="round-arrow" onClick={(event) => { event.stopPropagation(); go('event?id=live-night') }} aria-label="Открыть событие">
              <ArrowRight size={20} />
            </button>
          </div>
        </section>

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
  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 550)
    return () => window.clearTimeout(timer)
  }, [mood])

  return (
    <>
      <Screen className="discover-screen">
        <header className="discover-header">
          <span className="kicker">Не список заведений</span>
          <h1>{mood ? `Настроение: ${mood}` : 'Найти свой вечер'}</h1>
          <p>Выберите повод — приложение покажет подходящую атмосферу, кухню и доступные действия.</p>
        </header>
        <div className="filter-row">
          {['Все', 'Свидание', 'С семьёй', 'Шумный вечер'].map((label) => (
            <button key={label} className={(mood === label || (!mood && label === 'Все')) ? 'active' : ''} onClick={() => go(label === 'Все' ? 'discover' : `discover?mood=${encodeURIComponent(label)}`)}>{label}</button>
          ))}
        </div>
        {loading ? (
          <div className="skeleton-list" aria-label="Загрузка ресторанов">
            {[1, 2, 3].map((item) => <div className="skeleton-card" key={item}><span /><i /><i /></div>)}
          </div>
        ) : (
          <div className="restaurant-list">
            {restaurants.map((restaurant, index) => (
              <button className="restaurant-list-card" key={restaurant.id} onClick={() => go(`restaurant?id=${restaurant.id}`)}>
                <span className="list-number">0{index + 1}</span>
                <RestaurantVisual restaurant={restaurant} compact />
                <div className="list-meta">
                  <span>{restaurant.moods.join(' · ')}</span>
                  <ChevronRight size={18} />
                </div>
              </button>
            ))}
          </div>
        )}
      </Screen>
      <BottomNav active="search" />
    </>
  )
}

function RestaurantPage({ restaurant }: { restaurant: Restaurant }) {
  const primary = restaurant.id === 'besame' ? 'Забронировать для свидания' : 'Забронировать столик'
  return (
    <Screen className="restaurant-page">
      <div className="restaurant-cover">
        <img src={asset(restaurant.image)} alt={`Атмосфера «${restaurant.name}»`} />
        <div className="cover-gradient" />
        <button className="icon-button cover-back" onClick={() => window.history.back()} aria-label="Назад"><ArrowLeft size={20} /></button>
        <button className="icon-button cover-heart" onClick={() => go(`restaurant?id=${restaurant.id}&saved=1`)} aria-label="Добавить в избранное"><Heart size={20} /></button>
        <div className="restaurant-title">
          <span>{restaurant.eyebrow}</span>
          <h1>{restaurant.name}</h1>
          <p><MapPin size={14} /> {restaurant.address}</p>
        </div>
      </div>
      <div className="restaurant-content">
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

function BookingPage({ restaurant, booking, setBooking, source }: { restaurant: Restaurant; booking: BookingState; setBooking: (next: BookingState) => void; source?: string | null }) {
  const dates = ['15 августа', '16 августа', '17 августа']
  const times = ['18:30', '19:00', '19:30', '20:00', '20:30', '21:00']
  return (
    <Screen className="booking-screen">
      <BackHeader title="Столик" overline={restaurant.name} />
      {source === 'event' && <div className="context-note"><Ticket size={17} /><span>Бронирование после события: <strong>«Вечер живой музыки»</strong></span></div>}
      <RestaurantVisual restaurant={restaurant} compact />
      <section className="booking-block">
        <span className="kicker">01 · день</span>
        <h2>Когда вас ждать?</h2>
        <div className="option-row dates">
          {dates.map((date) => <button key={date} className={booking.date === date ? 'selected' : ''} onClick={() => setBooking({ ...booking, date })}>{date.replace(' ', '\n')}</button>)}
        </div>
      </section>
      <section className="booking-block">
        <span className="kicker">02 · время</span>
        <h2>Свободные интервалы</h2>
        <div className="time-grid">
          {times.map((time) => <button key={time} className={booking.time === time ? 'selected' : ''} onClick={() => setBooking({ ...booking, time })}>{time}</button>)}
        </div>
        <small className="demo-caption">Доступность времени показана для демонстрации и не связана с системой ресторана.</small>
      </section>
      <section className="guest-row">
        <div><span className="kicker">03 · компания</span><h2>Количество гостей</h2></div>
        <Stepper value={booking.guests} setValue={(guests) => setBooking({ ...booking, guests })} />
      </section>
      <button className="sticky-primary" onClick={() => go(`booking-details?restaurant=${restaurant.id}${source === 'event' ? '&source=event' : ''}`)}>Продолжить <ArrowRight size={19} /></button>
    </Screen>
  )
}

function BookingDetailsPage({ restaurant, booking, setBooking }: { restaurant: Restaurant; booking: BookingState; setBooking: (next: BookingState) => void }) {
  return (
    <Screen className="form-screen">
      <BackHeader title="Детали брони" overline={restaurant.name} />
      <div className="summary-ticket">
        <div><CalendarDays /><span>{booking.date}</span></div>
        <div><Clock3 /><span>{booking.time}</span></div>
        <div><UsersRound /><span>{booking.guests} гостя</span></div>
      </div>
      <section className="form-copy"><span className="kicker">Почти готово</span><h1>Кому подтвердить столик?</h1><p>В демонстрации данные остаются только на этом устройстве и никуда не отправляются.</p></section>
      <label className="field"><span>Имя</span><input value={booking.name} onChange={(event) => setBooking({ ...booking, name: event.target.value })} /></label>
      <label className="field"><span>Телефон</span><input value={booking.phone} onChange={(event) => setBooking({ ...booking, phone: event.target.value })} inputMode="tel" /></label>
      <label className="field"><span>Комментарий</span><input placeholder="Например, столик у окна" /></label>
      <div className="safe-note"><Check size={17} /><span>Без реального бронирования и звонка</span></div>
      <button className="sticky-primary" onClick={() => go(`booking-success?restaurant=${restaurant.id}`)}>Подтвердить демобронь</button>
    </Screen>
  )
}

function BookingSuccessPage({ restaurant, booking }: { restaurant: Restaurant; booking: BookingState }) {
  return (
    <Screen className="result-screen booking-result">
      <div className="success-mark"><Check size={34} /></div>
      <span className="kicker">Демонстрация завершена</span>
      <h1>Столик выбран</h1>
      <p>В реальном продукте здесь появятся подтверждение ресторана и возможность изменить бронь.</p>
      <div className="result-card">
        <RestaurantVisual restaurant={restaurant} compact />
        <div className="result-details">
          <span><CalendarDays />{booking.date}</span><span><Clock3 />{booking.time}</span><span><UsersRound />{booking.guests} гостя</span>
        </div>
      </div>
      <button className="primary-button" onClick={() => go('home')}>На главную</button>
      <button className="secondary-button" onClick={() => go('events')}>Посмотреть афишу</button>
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
          <span className="demo-badge">Демонстрационный анонс</span>
          <div><small>Чо-Чо · вечер</small><strong>Живая музыка и ужин</strong><span>Открыть и выбрать столик <ArrowRight size={16} /></span></div>
        </button>
        <div className="event-list">
          <button onClick={() => go('event?id=brunch')}><span className="event-date">ВС<br /><b>11:00</b></span><div><small>Bésame mucho · демосценарий</small><strong>Долгий воскресный завтрак</strong></div><ChevronRight /></button>
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
  return (
    <Screen className="event-page">
      <div className="event-image">
        <img src={asset(isBrunch ? 'assets/besame.webp' : 'assets/cho-interior.webp')} alt="Атмосфера события" />
        <button className="icon-button cover-back" onClick={() => window.history.back()} aria-label="Назад"><ArrowLeft /></button>
        <span className="demo-badge">Демонстрационный анонс</span>
      </div>
      <div className="event-copy">
        <span className="kicker">{restaurant.name} · повод встретиться</span>
        <h1>{isBrunch ? 'Долгий воскресный завтрак' : 'Живая музыка и ужин'}</h1>
        <p>Афиша становится началом действия: после интересного анонса пользователь сразу видит ресторан, время и переходит к бронированию.</p>
        <div className="event-facts"><span><Clock3 /> Время выбирается при бронировании</span><span><MapPin /> {restaurant.address}</span></div>
        <button className="primary-button" onClick={() => go(`booking?restaurant=${restaurant.id}&source=event`)}><CalendarDays /> Выбрать столик</button>
        <button className="secondary-button" onClick={() => go(`restaurant?id=${restaurant.id}`)}>О ресторане</button>
      </div>
    </Screen>
  )
}

function MenuPage({ restaurant, mode }: { restaurant: Restaurant; mode?: string | null }) {
  const restaurantDishes = dishes.filter((dish) => dish.restaurantId === restaurant.id)
  return (
    <Screen className="menu-screen">
      <BackHeader title={mode === 'order' ? 'Заказ' : 'Меню'} overline={restaurant.name} action={<button className="icon-button" onClick={() => go(`cart?restaurant=${restaurant.id}`)} aria-label="Корзина"><ShoppingBag size={19} /></button>} />
      <div className="menu-intro"><span className="kicker">Отдельный контекст ресторана</span><h1>{restaurant.name}</h1><p>Меню и корзина не смешиваются с другими заведениями.</p></div>
      <div className="menu-tabs"><button className="active">Популярное</button><button onClick={() => go(`menu?restaurant=${restaurant.id}&category=main`)}>Основное</button><button onClick={() => go(`menu?restaurant=${restaurant.id}&category=drinks`)}>Напитки</button></div>
      {restaurantDishes.length > 0 ? (
        <div className="dish-list">
          {restaurantDishes.map((dish) => (
            <button key={dish.id} className={`dish-card ${!dish.available ? 'unavailable' : ''}`} onClick={() => go(`dish?restaurant=${restaurant.id}&id=${dish.id}`)}>
              <img src={asset(dish.image)} alt={dish.name} />
              <div><small>{dish.available ? 'Доступно · демоданные' : 'Сегодня недоступно'}</small><strong>{dish.name}</strong><p>{dish.description}</p><span>{formatMoney(dish.price)} · демоцена</span></div>
            </button>
          ))}
        </div>
      ) : (
        <div className="menu-readonly"><Utensils size={30} /><h2>Меню для просмотра</h2><p>Заказ для этого ресторана не заявлен в концепции без публичного подтверждения сценария.</p><button className="primary-button" onClick={() => go(`booking?restaurant=${restaurant.id}`)}>Забронировать столик</button></div>
      )}
    </Screen>
  )
}

function DishPage({ dish, addToCart }: { dish: Dish; addToCart: (dish: Dish) => void }) {
  const restaurant = findRestaurant(dish.restaurantId)
  return (
    <Screen className="dish-page">
      <div className="dish-hero"><img src={asset(dish.image)} alt={dish.name} /><button className="icon-button cover-back" onClick={() => window.history.back()} aria-label="Назад"><ArrowLeft /></button></div>
      <div className="dish-copy"><span className="kicker">{restaurant.name} · демоменю</span><h1>{dish.name}</h1><p>{dish.description}</p><div className="dish-price"><strong>{formatMoney(dish.price)}</strong><span>Демонстрационная цена</span></div></div>
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
          <div className="cart-lines">{lines.map((line) => <div className="cart-line" key={line.id}><img src={asset(line.image)} alt="" /><div><strong>{line.name}</strong><span>{formatMoney(line.price)}</span></div><Stepper value={line.quantity} setValue={(next) => setQuantity(line.id, next - line.quantity)} min={0} /></div>)}</div>
          <button className="add-more" onClick={() => go(`menu?restaurant=${restaurant.id}&mode=order`)}><Plus /> Добавить ещё</button>
          <div className="order-total"><span>Итого · демоданные</span><strong>{formatMoney(cartTotal(lines))}</strong></div>
          <button className="sticky-primary" onClick={() => go(`checkout?restaurant=${restaurant.id}`)}>К оформлению <ArrowRight /></button>
        </>
      )}
    </Screen>
  )
}

function CheckoutPage({ restaurant, total }: { restaurant: Restaurant; total: number }) {
  return (
    <Screen className="checkout-screen">
      <BackHeader title="Оформление" overline={restaurant.name} />
      <section className="checkout-choice"><span className="kicker">Как получить</span><div className="service-tabs"><button className="selected"><ShoppingBag /> Самовывоз</button><button onClick={() => go(`checkout?restaurant=${restaurant.id}&service=delivery`)}><MapPin /> Доставка</button></div></section>
      <button className="checkout-row" onClick={() => go(`checkout?restaurant=${restaurant.id}&point=selected`)}><div><small>Точка</small><strong>{restaurant.address}</strong></div><ChevronRight /></button>
      <button className="checkout-row" onClick={() => go(`checkout?restaurant=${restaurant.id}&time=1930`)}><div><small>Время</small><strong>Сегодня, 19:30 · демо</strong></div><ChevronRight /></button>
      <button className="checkout-row" onClick={() => go('loyalty')}><div><small>ЧОткая карта</small><strong>Начислить бонусы</strong></div><ChevronRight /></button>
      <div className="payment-card"><CreditCard /><div><small>Способ оплаты</small><strong>Демонстрационная карта</strong></div><Check /></div>
      <div className="safe-note"><Check /><span>Оплата не выполняется. Никакие данные не отправляются.</span></div>
      <div className="order-total"><span>К оплате</span><strong>{formatMoney(total)}</strong></div>
      <button className="sticky-primary" onClick={() => go(`payment-error?restaurant=${restaurant.id}`)}>Проверить сценарий оплаты</button>
    </Screen>
  )
}

function PaymentErrorPage({ restaurant, total }: { restaurant: Restaurant; total: number }) {
  const displayTotal = total || 1880
  return (
    <Screen className="result-screen error-result">
      <div className="error-mark"><X size={34} /></div>
      <span className="kicker">Демонстрационная ошибка</span>
      <h1>Оплата не прошла</h1>
      <p>Корзина, ресторан, способ получения и выбранное время сохранены.</p>
      <div className="restore-card"><RotateCcw /><div><strong>Можно продолжить без повтора</strong><span>{restaurant.name} · {formatMoney(displayTotal)} · демоданные</span></div></div>
      <button className="primary-button" onClick={() => go(`order-success?restaurant=${restaurant.id}`)}>Повторить оплату</button>
      <button className="secondary-button" onClick={() => go(`cart?restaurant=${restaurant.id}`)}>Вернуться в корзину</button>
    </Screen>
  )
}

function OrderSuccessPage({ restaurant, total, clearCart }: { restaurant: Restaurant; total: number; clearCart: () => void }) {
  return (
    <Screen className="result-screen order-result">
      <div className="success-mark"><Check /></div>
      <span className="kicker">Без реальной оплаты</span>
      <h1>Заказ подтверждён в демосценарии</h1>
      <p>Показан финал пользовательского пути после восстановления сохранённой корзины.</p>
      <div className="receipt"><ReceiptText /><div><small>{restaurant.name}</small><strong>{formatMoney(total)}</strong><span>Самовывоз · сегодня, 19:30</span></div></div>
      <button className="primary-button" onClick={() => { clearCart(); go('home') }}>Завершить демонстрацию</button>
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
          <div className="loyalty-top"><img src={asset('assets/app-icon.webp')} alt="Иконка приложения «ЧОткая карта»" /><span>Демонстрационный баланс</span></div>
          <strong>860 <small>бонусов</small></strong>
          <div className="qr-large"><QrCode size={86} /><span>Демо-код</span></div>
          <div className="card-bottom"><span>1 бонус = 1 рубль</span><span>Уровень · демо</span></div>
        </div>
        <section className="rules-card"><h2>Публичные условия</h2><ul><li>Кешбэк растёт от 3% до 10% в зависимости от визитов.</li><li>Бонусами можно оплатить до 20% покупки.</li><li>Накопленные бонусы активны 90 дней и начисляются через 12 часов.</li></ul><a href="https://restoran-cho.ru/card" target="_blank" rel="noreferrer">Официальные правила <ArrowRight size={16} /></a></section>
        <section className="brand-dots"><span>Чо-Чо</span><span>Птичка-Невеличка</span><span>Катенька-Катюша</span><span>Bésame mucho</span></section>
      </Screen>
      <BottomNav active="card" />
    </>
  )
}

function HistoryPage({ repeatOrder }: { repeatOrder: () => void }) {
  return (
    <>
      <Screen className="history-screen">
        <header className="history-header"><span className="kicker">Моё</span><h1>История и быстрый возврат</h1></header>
        <div className="profile-card"><div>А</div><span><strong>Демо-профиль</strong><small>Данные не отправляются</small></span><ChevronRight /></div>
        <section className="history-section"><h2>Недавний заказ</h2><div className="past-order"><div className="past-top"><span><strong>Чо-Чо</strong><small>Демонстрационная история</small></span><b>1 880 ₽</b></div><p><Check /> 2 позиции доступны, цены проверены</p><button className="primary-button" onClick={repeatOrder}><RotateCcw /> Повторить заказ</button></div></section>
        <section className="history-section"><h2>Посещения</h2><button className="visit-card" onClick={() => go('restaurant?id=ptichka')}><img src={asset('assets/ptichka.webp')} alt="" /><div><small>Недавний визит · демо</small><strong>Птичка-Невеличка</strong><span>Посмотреть ресторан снова</span></div><ChevronRight /></button></section>
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

  useEffect(() => {
    if (!window.location.hash) go('home')
    const onHash = () => setLocation(parseHash(window.location.hash))
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => localStorage.setItem('chotkie-demo-carts', JSON.stringify(carts)), [carts])

  const restaurant = useMemo(() => findRestaurant(location.params.get('restaurant') || location.params.get('id')), [location])
  const dish = useMemo(() => findDish(location.params.get('id')), [location])

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
    case 'restaurant': page = <RestaurantPage restaurant={restaurant} />; break
    case 'booking': page = <BookingPage restaurant={restaurant} booking={{ ...booking, restaurantId: restaurant.id }} setBooking={setBooking} source={location.params.get('source')} />; break
    case 'booking-details': page = <BookingDetailsPage restaurant={restaurant} booking={{ ...booking, restaurantId: restaurant.id }} setBooking={setBooking} />; break
    case 'booking-success': page = <BookingSuccessPage restaurant={restaurant} booking={booking} />; break
    case 'events': page = <EventsPage />; break
    case 'event': page = <EventPage id={location.params.get('id')} />; break
    case 'menu': page = <MenuPage restaurant={restaurant} mode={location.params.get('mode')} />; break
    case 'dish': page = <DishPage dish={dish} addToCart={addToCart} />; break
    case 'cart': page = <CartPage restaurant={restaurant} lines={carts[restaurant.id]} setQuantity={(id, delta) => setCarts((current) => updateLine(current, restaurant.id, id, delta))} />; break
    case 'checkout': page = <CheckoutPage restaurant={restaurant} total={cartTotal(carts[restaurant.id])} />; break
    case 'payment-error': page = <PaymentErrorPage restaurant={restaurant} total={cartTotal(carts[restaurant.id])} />; break
    case 'order-success': page = <OrderSuccessPage restaurant={restaurant} total={cartTotal(carts[restaurant.id])} clearCart={() => setCarts((current) => ({ ...current, [restaurant.id]: [] }))} />; break
    case 'loyalty': page = <LoyaltyPage />; break
    case 'history': page = <HistoryPage repeatOrder={repeatOrder} />; break
    default: page = <HomePage />
  }

  return <AppShell>{page}</AppShell>
}
