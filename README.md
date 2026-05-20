# Dota 2 Finder

Поиск тиммейтов, команды, чат и кланвары.

## Стек

- **Фронт:** React + Vite → [Vercel](https://d2finder.vercel.app)
- **Бэк:** Express + Prisma + Socket.IO → Render
- **БД:** PostgreSQL

## Локально

```bash
# Сервер
cd server
cp .env.example .env   # заполните DATABASE_URL, JWT_SECRET
npm install
npm run db:push
npm run dev

# Клиент (другой терминал)
cd client
npm install
npm run dev
```

Клиент: http://localhost:5173 (прокси `/api` и WebSocket на :3001).

## Деплой

### Vercel (client)

В **Environment Variables**:

| Переменная | Пример |
|------------|--------|
| `VITE_API_URL` | `https://your-app.onrender.com/api` |
| `VITE_SOCKET_URL` | `https://your-app.onrender.com` |
| `VITE_MEDIA_URL` | `https://your-app.onrender.com` |

Root Directory: `client`.

### Render (server)

| Переменная | Описание |
|------------|----------|
| `DATABASE_URL` | PostgreSQL |
| `JWT_SECRET` | секрет для токенов |
| `CLIENT_URL` | `https://d2finder.vercel.app` |
| `PUBLIC_URL` | публичный URL Render (для ссылок на аватары) |

Build: `npm install && npm run build`  
Start: `npm start`
