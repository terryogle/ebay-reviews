# HealthyLine Outlet — Виджет отзывов с eBay (GitHub Pages + 2 строчки HTML)

Готовое, визуально аккуратное решение для переноса и отображения реальных отзывов магазина **`healthylineoutlet`** с eBay на сайт **`healthylineoutlet.com`** (WordPress + WooCommerce + Elementor) **без установки WordPress-плагинов и без ежемесячных платных подписок**.

В базу `data/reviews.json` **уже вшиты реальные верифицированные отзывы покупателей `healthylineoutlet` с eBay** (с реальными фото покупателей, ответами продавца, метриками `100% Positive • 1,305 Score • Top-Rated Seller` и ссылками на реальные карточки ковриков `healthylineoutlet.com`).

---

## Как за 3 минуты опубликовать через GitHub и вставить на сайт

### Шаг 1. Загрузи эту папку в новый публичный репозиторий GitHub
1. Создай на GitHub новый **Public** репозиторий, например: `hlo-ebay-reviews`.
2. Загрузи в него все файлы из этой папки (через кнопку **Add file → Upload files** прямо в браузере или через `git push`).

### Шаг 2. Включи бесплатный хостинг GitHub Pages (2 клика)
1. В репозитории открой **Settings → Pages**.
2. В блоке **Build and deployment → Source** выбери `Deploy from a branch`, ветку `main` и папку `/ (root)`, нажми **Save**.
3. Через 40 секунд твой виджет и живое демо будут доступны по адресу:
   - Демо для показа заказчику: `https://ТВОЙ_ЛОГИН.github.io/hlo-ebay-reviews/`
   - Скрипт виджета: `https://ТВОЙ_ЛОГИН.github.io/hlo-ebay-reviews/widget.js`

*(Альтернатива с глобальным CDN: файлы из публичного GitHub-репозитория сразу раздаются и через `https://cdn.jsdelivr.net/gh/ТВОЙ_ЛОГИН/hlo-ebay-reviews@main/widget.js`).*

### Шаг 3. Вставь код на сайт `healthylineoutlet.com`
В админке WordPress открой нужную страницу в **Elementor**, перетащи стандартный виджет **«HTML»** и вставь:

#### Вариант 0 — Самое простое: ОДНА строчка (слайдер по умолчанию)
```html
<script src="https://ТВОЙ_ЛОГИН.github.io/hlo-ebay-reviews/widget.js" defer></script>
```
Контейнер создаётся сам. Ни `div`, ни атрибутов не нужно.

#### Вариант А — Полная секция отзывов (для страницы Reviews или низа Главной):
```html
<div class="hlo-ebay-reviews" data-layout="showcase" data-limit="9"></div>
<script src="https://ТВОЙ_ЛОГИН.github.io/hlo-ebay-reviews/widget.js" defer></script>
```

#### Вариант Б — Горизонтальный слайдер-карусель (для Главной страницы):
```html
<div class="hlo-ebay-reviews" data-layout="carousel" data-limit="12"></div>
<script src="https://ТВОЙ_ЛОГИН.github.io/hlo-ebay-reviews/widget.js" defer></script>
```

#### Вариант В — Компактный бейдж доверия для карточек товаров WooCommerce (открывает модальное окно со всеми отзывами по клику):
```html
<div class="hlo-ebay-reviews" data-layout="badge" data-product="auto"></div>
<script src="https://ТВОЙ_ЛОГИН.github.io/hlo-ebay-reviews/widget.js" defer></script>
```

Виджет рендерится внутри изолированного **Shadow DOM**, поэтому стили Elementor / темы сайта никогда не сломают вёрстку виджета, а виджет не затронет стили сайта. Плюс скрипт автоматически добавляет в `<head>` микроразметку `Schema.org AggregateRating` для SEO.

---

## Как работает автоматическое обновление отзывов?

HTML-код на самом сайте `healthylineoutlet.com` **трогать больше никогда не нужно** — скрипт всегда подтягивает свежий `data/reviews.json` с GitHub Pages.

В репозитории уже настроен робот **GitHub Actions** (`.github/workflows/sync-reviews.yml`), который запускается каждый день в `06:00 UTC`:
1. Зарегистрируй бесплатный аккаунт на [developer.ebay.com](https://developer.ebay.com/) (подойдёт даже **личный** аккаунт — доступ к клиентскому `healthylineoutlet` не обязателен, т.к. метод `GetFeedback` принимает публичный `<UserID>healthylineoutlet</UserID>`; а если выпустить токен с аккаунта клиента, дополнительно откроются названия моделей из `Private listing`).
2. Добавь в репозитории GitHub в **Settings → Secrets and variables → Actions** секреты:
   - `EBAY_CLIENT_ID`
   - `EBAY_CLIENT_SECRET`
   - `EBAY_REFRESH_TOKEN` *(живёт 18 месяцев, обновляется сам)*
   *(или разовый `EBAY_OAUTH_TOKEN` для мгновенной полной докачки архива через кнопку **Actions → Sync eBay Reviews → Run workflow**)*.
3. GitHub сам каждый день забирает новые отзывы по официальному API eBay (без капч и блокировок), сопоставляет их с каталогом `healthylineoutlet.com` и обновляет `data/reviews.json`.

---

## Универсальная вставка: одна строчка на ЛЮБОЙ сайт

Если не нужен кастомный дизайн-контейнер, достаточно **одной строки** — виджет сам создаст контейнер в месте вставки:

```html
<script src="https://ТВОЙ_ЛОГИН.github.io/hlo-ebay-reviews/widget.js" defer></script>
```

Работает в WordPress/Elementor, Shopify, Tilda, Webflow, Wix, Bitrix и в обычном HTML. По умолчанию включается режим **Homepage Slider (Carousel)**.

### Параметры (необязательно)

Через атрибуты контейнера:

```html
<div class="hlo-ebay-reviews"
     data-layout="carousel"     <!-- carousel | showcase | badge -->
     data-limit="12"            <!-- сколько отзывов брать -->
     data-theme="tinted"        <!-- tinted | light -->
     data-autoplay="false"      <!-- авто-прокрутка; по умолчанию включена -->
     data-product="auto"        <!-- на странице товара поднимает отзывы про эту модель -->
     data-seo="true"            <!-- микроразметка Schema.org AggregateRating -->
></div>
```

Или через URL скрипта: `widget.js?layout=badge&theme=light&autoplay=false`.

---

## Что умеет карусель (режим по умолчанию)

- Тянется мышкой (drag-scroll), свайпом на телефоне, стрелками `‹` `›` и клавишами `←` `→`.
- Мягкая авто-прокрутка каждые 6 секунд — останавливается при наведении, касании и открытом окне.
- Тематические фильтры с живыми счётчиками: `All Stories (55)`, `Pain Relief & Sleep (13)`, `Like-New Condition (27)`, `Fast Shipping (30)`, `Matched to Models (13)`.
- Одинаковая высота карточек, текст обрезан до 5 строк, кнопка **Read full review →**.
- **Клик по любой карточке** открывает окно с полным текстом, фото покупателя, ответом продавца, ссылкой на модель товара и кнопкой **Verify on eBay ↗**.
- Кнопка **Search All Reviews (55)** открывает полноэкранный каталог с поиском по словам (`TAJ`, `PEMF`, `pain`, `like new`) и подсветкой совпадений.
- Полоса прогресса и счётчик `1 – 3 of 55`.
- `Esc` закрывает окно, клик по фону — тоже.

---

## Сколько отзывов и насколько точное совпадение

| Показатель eBay | Значение |
|---|---|
| Feedback Score | **1,305** |
| Positive | **100%** (111 положительных / 0 отрицательных за 12 мес.) |
| Seller Feedback (отзывы продавца) | **1,077** |
| Всего записей, включая оценки покупателей | 1,579 |
| Продано товаров | 3,100+ |
| Detailed Seller Ratings | **5.0 / 5.0** по всем 4 критериям |

- В `data/reviews.json` лежат **55** отзывов — **дословно**, слово в слово с eBay (реальные фото, реальные ответы продавца, реальные оценки, периоды).
- Почему не 1,077: из 1,077 записей ~82 — автоматические фразы eBay (*«Order delivered on time with no issues»*), а более 800 — короткие 1–3 слова (*«Thanks»*, *«Good»*, *«A+++»*). Виджет показывает именно содержательные отзывы; короткие удаляются автоматически при синхронизации.
- Совпадение текста: **100% verbatim**. Совпадение метрик: **1:1** с публичным профилем продавца.
- Новые содержательные отзывы робот докачивает раз в сутки и дописывает в конец JSON — на сайте они появляются сами (кэш обновляется в течение часа).

---

## Если токена eBay нет

Да, всё работает и без доступа к аккаунту клиента:

1. `scripts/browser_collector.js` — скрипт для консоли Chrome, собирает отзывы со страниц профиля из обычного браузера (без API и без токенов).
2. `data/reviews.json` уже заполнен — сайт можно запускать сегодня.
3. Когда появится `EBAY_CLIENT_ID` / `EBAY_CLIENT_SECRET` / `EBAY_REFRESH_TOKEN` — включится ежедневное авто-обновление.
