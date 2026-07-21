# Инструкция по запуску фронтенда

## Быстрый старт

1. Перейдите в папку frontend:
```bash
cd frontend
```

2. Установите зависимости:
```bash
npm install
```

3. Запустите dev-сервер:
```bash
npm run dev
```

4. Откройте в браузере:
```
http://localhost:3001
```

## Настройка API

По умолчанию фронтенд использует прокси, который перенаправляет запросы на `/api` на `http://localhost:3000`.

Если ваш API находится на другом адресе, создайте файл `.env` в папке `frontend`:

```env
VITE_API_URL=http://localhost:3000
```

Или для удаленного сервера:
```env
VITE_API_URL=http://your-server-ip:3000
```

## Структура проекта

```
frontend/
├── src/
│   ├── components/        # Компоненты UI
│   │   ├── Header.tsx     # Шапка сайта
│   │   ├── Footer.tsx     # Подвал
│   │   ├── Hero.tsx       # Главный баннер
│   │   ├── Stats.tsx      # Статистика
│   │   ├── Categories.tsx # Категории
│   │   └── FeaturedTracks.tsx # Популярные треки
│   ├── pages/
│   │   └── HomePage.tsx   # Главная страница
│   ├── services/          # API сервисы
│   │   ├── api.ts         # Базовый API клиент
│   │   ├── tracksService.ts
│   │   └── categoriesService.ts
│   └── types/             # TypeScript типы
└── vite.config.ts         # Конфигурация Vite
```

## API интеграция

Фронтенд уже интегрирован с вашим API:

- ✅ Загрузка треков (`GET /tracks`)
- ✅ Загрузка категорий (`GET /categories`)
- ✅ Автоматическое добавление JWT токена к запросам

## Особенности

- **Адаптивный дизайн** - работает на всех устройствах
- **Стиль 101beat.com** - современный интерфейс
- **Интеграция с API** - реальные данные из вашего бэкенда
- **TypeScript** - типобезопасность
- **Tailwind CSS** - быстрая стилизация
