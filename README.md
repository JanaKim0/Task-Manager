# Task Manager — аналог Trello

Учебный pet-проект: доски задач с рабочими пространствами, проектами, колонками и карточками.

## Стек

| Слой | Технология | Зачем |
|---|---|---|
| Frontend | Angular 20 + TypeScript + SCSS | большие компоненты, роутинг, формы |
| Backend | NestJS 11 + TypeScript | REST API, архитектура «как в Angular» |
| ORM | Prisma | схема БД в одном файле, миграции, типобезопасность |
| БД | SQLite (позже — PostgreSQL) | связанные сущности, внешние ключи |

Один язык на весь проект — **TypeScript**.

## Структура

```
Task Manager/
├── backend/    — NestJS API (порт 3000)
├── frontend/   — Angular SPA (порт 4200)
└── docs/       — план разработки и схема БД
```

## Запуск

Backend:

```bash
cd backend && npm install && npx prisma migrate dev && npm run seed && npm run start:dev
```

Frontend (в отдельном терминале):

```bash
cd frontend && npm install && npm start
```

Открыть http://localhost:4200

## Модель данных

```
User ──< Membership >── Workspace ──< Project ──< Board ──< Column ──< Card
                                                                       ├──< Assignee >── User
                                                                       └──< Comment ──> User
```

Подробнее — [docs/ROADMAP.md](docs/ROADMAP.md).

## Этапы

- [x] **Этап 1** — фундамент: репозиторий, схема БД, API рабочих пространств и проектов, каркас Angular
- [ ] **Этап 2** — доски, колонки, карточки: полный CRUD и экран доски
- [ ] **Этап 3** — исполнители, комментарии, дедлайны, приоритет, фильтр
- [ ] **Этап 4** — Drag & Drop, полировка UI, деплой
