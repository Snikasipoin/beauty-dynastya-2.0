# Telegram-заявки через Bothost

Сайт остаётся статическим React-приложением на Timeweb. Отдельный сервис Bothost принимает заявки по HTTPS и отправляет их от @beautydynastya_bot только получателям из TELEGRAM_ADMIN_IDS. Токен остаётся в переменных окружения Bothost.

## Поля формы Bothost

| Поле | Значение |
| --- | --- |
| Платформа | Telegram |
| Язык | Node.js |
| Образ | Node.js 22; собственный Dockerfile использует Node.js 22 Debian Slim |
| Bot Token | Токен существующего @beautydynastya_bot |
| Git URL | https://github.com/Snikasipoin/beauty-dynastya-2.0.git |
| Ветка | codex/bothost-bot |
| Главный файл | index.js |
| Использовать домен | Включено; можно автоматический домен Bothost |
| Порт | 3000 |
| Использовать собственный Dockerfile | Включено |

Ветка содержит только готовый JavaScript обработчика, package.json без внешних зависимостей и лёгкий Dockerfile. TypeScript и файлы сайта на Bothost не нужны. Dockerfile запускает код вне /app, чтобы монтирование исходников Bothost не скрыло рабочую копию.

## Переменные окружения Bothost

- TELEGRAM_ADMIN_IDS — числовые Telegram ID получателей через запятую.
- APP_ORIGIN — https://beauty-dynastya.com
- PORT — 3000; должен совпадать с портом в настройках домена.
- TRUST_PROXY — 1, только если контейнер доступен исключительно через reverse proxy Bothost.

Токен из поля Bot Token автоматически доступен как BOT_TOKEN; обработчик также поддерживает TELEGRAM_BOT_TOKEN. Дополнительный токен для Telegram webhook не нужен: сервис получает заявки с сайта, а не входящие сообщения Telegram.

Каждый получатель должен нажать «Запустить» у @beautydynastya_bot. Список разрешённых получателей задаётся на сервере; данные формы не могут его изменить.

## Подключение сайта на Timeweb

После создания Bothost покажет точный публичный HTTPS-домен. Используйте фактически выданный адрес, не придумывая его по имени бота.

В переменных сборки сайта Timeweb задайте:

VITE_APPLICATION_API_URL=https://ВЫДАННЫЙ-ДОМЕН/api/applications

Затем пересоберите сайт из main. VITE_BASE_PATH остаётся /. Переключать Timeweb в режим Node.js-бэкенда теперь не требуется. VITE_APPLICATION_API_URL — публичный адрес API, токен в него не входит.

Сервис разрешает браузерные запросы только с APP_ORIGIN и поддерживает CORS preflight. OPTIONS не отправляет сообщений. Ошибки API также доступны браузеру, поэтому форма сохраняет введённые данные и показывает понятное сообщение.

## Проверка

- После деплоя /health, /api/health и / отвечают JSON со статусом ok.
- GET /api/applications отвечает 405: заявки принимаются только методом POST.
- Отправьте одну явно тестовую заявку через сайт и проверьте получение сообщения каждым настроенным получателем.
- Health check подтверждает работу процесса, но не действительность токена и возможность написать получателю.

## Обновление ветки разработчиком

Источники находятся в main: server/*.ts и src/data/legal.ts.

1. Запустить pnpm build:bothost и проверки.
2. Закоммитить источники и deploy/bothost в main.
3. Выполнить git subtree split --prefix=deploy/bothost --branch codex/bothost-bot при первом создании ветки. При следующих обновлениях split можно запускать без --branch и отправлять полученный SHA в ту же ветку.
4. Отправить main и codex/bothost-bot в origin обычным push, без force.
5. Выполнить новый деплой Bothost из этой ветки.

Ветка генерируется из явного списка файлов. .env.local, токен и изображения сайта в неё не включаются. Ограничения доставки и повторов описаны в основной документации проекта docs/telegram-setup.md.

Официальные инструкции: [Dockerfile](https://bothost.ru/docs/custom-dockerfile), [главный файл](https://bothost.ru/docs/main-file-entrypoint), [домены и порты](https://bothost.ru/docs/domains-and-ports), [переменные окружения](https://bothost.ru/docs/environment-variables).
