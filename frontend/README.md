# BeatStore Frontend

Фронтенд приложение для музыкального маркетплейса BeatStore.

## Технологии

- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios
- Lucide React (иконки)

## Установка

```bash
cd frontend
npm install
```

## Запуск

```bash
npm run dev
```

Приложение будет доступно на `http://localhost:3001`

## API

По умолчанию API доступен на `http://localhost:3000`. 
Настройки можно изменить в `.env` файле:

```
VITE_API_URL=http://localhost:3000
```

## Структура проекта

```
frontend/
├── src/
│   ├── components/     # Переиспользуемые компоненты
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Hero.tsx
│   │   ├── Stats.tsx
│   │   ├── Categories.tsx
│   │   └── FeaturedTracks.tsx
│   ├── pages/          # Страницы приложения
│   │   └── HomePage.tsx
│   ├── services/       # API сервисы
│   │   ├── api.ts
│   │   ├── tracksService.ts
│   │   └── categoriesService.ts
│   ├── types/          # TypeScript типы
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
└── vite.config.ts
```