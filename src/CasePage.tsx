import { ArrowRight, CalendarDays, Check, CreditCard, QrCode, RotateCcw, Sparkles, Ticket, UsersRound, Utensils } from 'lucide-react'
import type { ReactNode } from 'react'

const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`
const demo = (hash: string) => `${import.meta.env.BASE_URL}#${hash}`

function DemoLink({ hash, children }: { hash: string; children: ReactNode }) {
  return <a className="case-button" href={demo(hash)}>{children}<ArrowRight size={17} /></a>
}

function Chapter({ id, number, eyebrow, title, children, tone = 'paper' }: { id: string; number: string; eyebrow: string; title: string; children: ReactNode; tone?: 'paper' | 'ink' | 'acid' | 'red' }) {
  return (
    <section className={`chapter tone-${tone}`} id={id}>
      <div className="chapter-number">{number}</div>
      <div className="chapter-main">
        <span className="chapter-eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        {children}
      </div>
    </section>
  )
}

function Phone({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`case-phone ${className}`}><div className="phone-notch" />{children}</div>
}

export function CasePage() {
  return (
    <div className="case-deck">
      <nav className="case-nav">
        <a href="#cover" className="case-logo">ЧР<span>Концепция</span></a>
        <div className="nav-dots"><a href="#cover" aria-label="Обложка" />{Array.from({ length: 10 }, (_, index) => <a key={index} href={`#c${index + 1}`} aria-label={`Раздел ${index + 1}`} />)}</div>
        <a className="nav-demo" href={demo('home')}>Прототип <ArrowRight size={14} /></a>
      </nav>

      <header className="case-cover" id="cover">
        <div className="cover-art">
          <img className="cover-a" src={asset('assets/cho-cho.webp')} alt="Интерьер «Чо-Чо»" />
          <img className="cover-b" src={asset('assets/besame.webp')} alt="Интерьер Bésame mucho" />
          <div className="cover-sticker">Инициативная<br />концепция</div>
        </div>
        <div className="cover-copy">
          <span>ООО «ЭРГОХАВЭН» · 2026</span>
          <h1>Выбрать<br /><i>настроение.</i><br />Забронировать<br />вечер.</h1>
          <p>Мобильная концепция для «Чотких ресторанов»: заведение выбирают по атмосфере и поводу, а затем сразу переходят к столу, событию, меню или заказу.</p>
          <DemoLink hash="home">Открыть прототип</DemoLink>
        </div>
        <div className="cover-disclaimer">Создано по открытым данным. Не является официальным продуктом группы.</div>
      </header>

      <Chapter id="c1" number="01" eyebrow="Что изучили" title="Четыре характера. Одна подтверждённая программа лояльности.">
        <div className="fact-layout">
          <div className="brand-stack">
            {[
              ['Чо-Чо', 'Мировая кухня, караоке, доставка и события', 'assets/cho-cho.webp'],
              ['Птичка-Невеличка', 'Блюда из птицы, летний сад, доставка и торты', 'assets/ptichka.webp'],
              ['Катенька-Катюша', 'Современная русская кухня, доставка и торты', 'assets/katenka.webp'],
              ['Bésame mucho', 'Испано-французское шеф-бистро и афиша артистов', 'assets/besame.webp'],
            ].map(([name, copy, image]) => <div className="brand-row" key={name}><img src={asset(image)} alt="" /><div><strong>{name}</strong><span>{copy}</span></div></div>)}
          </div>
          <div className="fact-card">
            <span>Проверено 11.08.2026</span>
            <h3>Публичные источники подтверждают участие всех четырёх ресторанов в программе.</h3>
            <ul><li>1 бонус = 1 рубль.</li><li>Кешбэк от 3% до 10% по числу визитов.</li><li>Оплата бонусами — до 20% покупки.</li></ul>
            <small>Условия взяты с официальной страницы программы. Применение правил требует сверки с действующей офертой на момент запуска.</small>
          </div>
        </div>
      </Chapter>

      <Chapter id="c2" number="02" eyebrow="Публичный цифровой путь" title="Интерес уже есть. Действие распределено между сайтами, телефоном и приложением." tone="ink">
        <div className="evidence-grid">
          <div><b>01</b><strong>Выбор</strong><p>У каждого ресторана свой сайт и визуальный язык. Пользователю нужно заранее знать, какое заведение искать.</p></div>
          <div><b>02</b><strong>Действие</strong><p>Меню, доставка, бронь, торты и афиша представлены по-разному. Наблюдение относится к публичному пути; внутренние системы не изучались.</p></div>
          <div><b>03</b><strong>Карта</strong><p>Приложение «ЧОткая карта» обновлено 3 августа 2026 года. Публичное описание сосредоточено на лояльности.</p></div>
          <div><b>04</b><strong>Отзывы</strong><p>В российской ленте App Store найден один текстовый отзыв — положительный. Выборка слишком мала для вывода о системных проблемах.</p></div>
        </div>
        <div className="hypothesis-line"><Sparkles /><p><strong>Гипотеза для проверки:</strong> вход через повод и атмосферу может сократить число шагов до подходящего ресторана и доступного действия.</p></div>
      </Chapter>

      <Chapter id="c3" number="03" eyebrow="Основная идея" title="Главный экран начинает с вопроса «куда пойти сегодня?»" tone="acid">
        <div className="idea-layout">
          <div className="idea-copy"><p>Редакционная витрина соединяет атмосферу, кухню, повод и события. Внутри ресторана сохраняется его собственный характер и набор доступных действий.</p><ul className="check-list"><li><Check /> Ресторан по свиданию, семейному обеду или шумному вечеру.</li><li><Check /> Событие ведёт прямо к выбору стола.</li><li><Check /> Заказы и корзины не смешиваются между заведениями.</li><li><Check /> Карта лояльности доступна из любой точки пути.</li></ul><DemoLink hash="discover?mood=Свидание">Выбрать по настроению</DemoLink></div>
          <Phone className="home-mock"><div className="mock-head"><small>Краснодар · вечер</small><strong>Куда пойдём?</strong></div><img src={asset('assets/cho-interior.webp')} alt="" /><div className="mock-overlay"><small>Афиша · демосценарий</small><strong>Сначала событие.<br />Потом — столик.</strong></div><div className="mock-tabs"><span>Свидание</span><span>С семьёй</span><span>Шумно</span></div></Phone>
        </div>
      </Chapter>

      <Chapter id="c4" number="04" eyebrow="Сценарий № 1" title="Повод → ресторан → дата → время → гости → подтверждение.">
        <div className="scenario-layout">
          <div className="scenario-copy"><div className="scenario-index">5 экранов</div><p>Пользователь выбирает настроение, видит различия между ресторанами и бронирует без возврата к поиску контактов.</p><div className="route-line"><span>Свидание</span><ArrowRight /><span>Bésame mucho</span><ArrowRight /><span>Столик</span></div><div className="detail-list"><span><CalendarDays />Дата и время</span><span><UsersRound />Количество гостей</span><span><Check />Демо-подтверждение</span></div><DemoLink hash="booking?restaurant=besame">Посмотреть бронирование</DemoLink></div>
          <div className="phone-pair"><Phone><div className="phone-photo"><img src={asset('assets/besame.webp')} alt="" /><span>Сиеста и любовь</span><strong>Bésame mucho</strong></div><div className="phone-action">Забронировать для свидания</div></Phone><Phone className="phone-back"><div className="calendar-mock"><small>Bésame mucho</small><h3>Когда вас ждать?</h3><div><b>15<br /><i>августа</i></b><b>16<br /><i>августа</i></b><b>17<br /><i>августа</i></b></div><h3>Свободные интервалы</h3><div className="times"><span>19:00</span><span className="active">19:30</span><span>20:00</span></div></div></Phone></div>
        </div>
      </Chapter>

      <Chapter id="c5" number="05" eyebrow="Сценарий № 2" title="Из афиши — к выбору столика на событие." tone="red">
        <div className="event-case">
          <div className="event-poster"><img src={asset('assets/cho-interior.webp')} alt="Интерьер «Чо-Чо»" /><span>Демонстрационный анонс</span><h3>Живая музыка<br />и ужин</h3></div>
          <div className="event-case-copy"><Ticket size={32} /><h3>Контекст события сохраняется</h3><p>После перехода к бронированию пользователь понимает, ради какого события выбирает время. Сценарий можно измерить отдельно.</p><div className="metric-chips"><span>Переход из события</span><span>Начало брони</span><span>Подтверждение</span></div><DemoLink hash="event?id=live-night">Открыть событие</DemoLink></div>
        </div>
      </Chapter>

      <Chapter id="c6" number="06" eyebrow="Сценарий № 3" title="Отдельная корзина ресторана переживает ошибку оплаты." tone="ink">
        <div className="recovery-layout">
          <div className="recovery-flow"><span><Utensils />Меню «Чо-Чо»</span><ArrowRight /><span><CreditCard />Оплата</span><ArrowRight /><span className="error-node">Ошибка</span><ArrowRight /><span><RotateCcw />Повтор</span></div>
          <div className="recovery-copy"><h3>Пользователь не собирает заказ заново</h3><p>Сохраняются позиции, ресторан, способ получения и выбранное время. В прототипе все цены и оплата — демонстрационные.</p><ul className="check-list"><li><Check /> Корзины разных ресторанов не смешиваются.</li><li><Check /> Недоступная позиция видна до оформления.</li><li><Check /> После ошибки есть понятный путь восстановления.</li></ul><DemoLink hash="payment-error?restaurant=cho&demo=1&service=delivery&address=selected&time=1930">Посмотреть восстановление</DemoLink></div>
        </div>
      </Chapter>

      <Chapter id="c7" number="07" eyebrow="Связь с бизнесом" title="Общая оболочка помогает выбору. Бренды остаются самостоятельными.">
        <div className="brand-principles">
          <div><span className="principle-icon">А</span><h3>Атмосфера</h3><p>Крупные фотографии и свой тон каждого ресторана вместо одинаковых карточек.</p></div>
          <div><span className="principle-icon">Д</span><h3>Действия</h3><p>Доставка показана только там, где публичный источник её подтверждает. Для Bésame mucho она не заявлена.</p></div>
          <div><span className="principle-icon">К</span><h3>Контекст</h3><p>Меню, бронь и корзина принадлежат выбранному заведению; рекомендации ведут в другой бренд осознанно.</p></div>
          <div><span className="principle-icon"><QrCode /></span><h3>Карта</h3><p>Общие подтверждённые правила доступны из любого сценария без утверждений о внутренних балансах и интеграциях.</p></div>
        </div>
      </Chapter>

      <Chapter id="c8" number="08" eyebrow="Предлагаемый пилот" title="Проверить три перехода — и сравнить с текущим публичным путём." tone="acid">
        <div className="pilot-layout">
          <div className="pilot-scope"><span>01</span><h3>Бронирование</h3><p>Выбор по поводу → ресторан → подтверждение.</p></div>
          <div className="pilot-scope"><span>02</span><h3>Афиша</h3><p>Событие → выбор времени → подтверждение.</p></div>
          <div className="pilot-scope"><span>03</span><h3>Повтор заказа</h3><p>Проверка доступности → корзина → восстановление.</p></div>
          <div className="pilot-metrics"><h3>Что сравнивать</h3><ul><li>время и количество шагов;</li><li>конверсию из начатого действия в подтверждённое;</li><li>долю завершённых бронирований;</li><li>переход из события к брони;</li><li>долю восстановленных корзин;</li><li>использование карты лояльности.</li></ul><small>Без целевых процентов: значения зависят от текущей аналитики и интеграций.</small></div>
        </div>
      </Chapter>

      <Chapter id="c9" number="09" eyebrow="Что берём на себя" title="От продуктовой проверки до поддержки после публикации." tone="paper">
        <div className="scope-grid">
          {['Продуктовая аналитика', 'UX/UI-дизайн', 'Разработка', 'Интеграции', 'Публикация', 'Обновления и техническая поддержка'].map((item, index) => <div key={item}><b>0{index + 1}</b><strong>{item}</strong></div>)}
        </div>
        <p className="scope-note">Состав интеграций, сроки и стоимость определяются после проверки действующих систем бронирования, доставки, лояльности и аналитики.</p>
      </Chapter>

      <Chapter id="c10" number="10" eyebrow="Следующий шаг" title="Показать прототип лично и выбрать сценарии пилота." tone="ink">
        <div className="contact-layout">
          <div><p className="contact-lead">ООО «ЭРГОХАВЭН» — аккредитованная ИТ-компания из Краснодара.</p><p>Предлагаем начать с пилота по бронированию, переходу из афиши и восстановлению заказа, проверить пути на данных компании и только затем расширять решение.</p><p>Берём на себя продуктовую аналитику, UX/UI-дизайн, разработку, интеграции, публикацию, обновления и техническую поддержку.</p><p>Готовы лично приехать и показать прототип команде.</p></div>
          <div className="contact-card"><span>Обсудить концепцию</span><a href="mailto:hello@eh.works">hello@eh.works</a><a href="https://eh.works" target="_blank" rel="noreferrer">eh.works</a><a href="https://t.me/andrey_ergohaven" target="_blank" rel="noreferrer">Telegram · @andrey_ergohaven</a><a href="https://max.ru/id5041212966_biz" target="_blank" rel="noreferrer">MAX · +7 988 154-04-00</a><DemoLink hash="home">Открыть прототип</DemoLink></div>
        </div>
        <footer className="case-footer"><span>Инициативная концепция ООО «ЭРГОХАВЭН», созданная на основе открытых данных.</span><span>Не является официальным продуктом «Чотких ресторанов».</span></footer>
      </Chapter>
    </div>
  )
}
