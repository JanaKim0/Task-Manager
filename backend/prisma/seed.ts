/**
 * Наполняет базу демо-данными, чтобы приложение не открывалось пустым.
 * Запуск: npm run seed
 */
import 'dotenv/config';
import { PrismaClient, Role, Priority } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Очищаю базу...');
  // Порядок важен: сначала дети, потом родители.
  await prisma.cardAssignee.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.card.deleteMany();
  await prisma.boardColumn.deleteMany();
  await prisma.board.deleteMany();
  await prisma.project.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();

  console.log('Создаю пользователей...');
  const yana = await prisma.user.create({
    data: { email: 'yana@example.com', name: 'Яна' },
  });
  const alex = await prisma.user.create({
    data: { email: 'alex@example.com', name: 'Алекс' },
  });

  console.log('Создаю рабочие пространства...');
  const personal = await prisma.workspace.create({
    data: {
      name: 'Личное',
      slug: 'personal',
      description: 'Учебные и домашние задачи',
      members: {
        create: [{ userId: yana.id, role: Role.OWNER }],
      },
    },
  });

  const studio = await prisma.workspace.create({
    data: {
      name: 'Веб-студия',
      slug: 'web-studio',
      description: 'Клиентские проекты',
      members: {
        create: [
          { userId: yana.id, role: Role.OWNER },
          { userId: alex.id, role: Role.MEMBER },
        ],
      },
    },
  });

  console.log('Создаю проекты и доски...');
  const portfolio = await prisma.project.create({
    data: {
      name: 'Портфолио',
      description: 'Шесть пет-проектов за месяц',
      color: '#4f46e5',
      workspaceId: personal.id,
    },
  });

  await prisma.project.create({
    data: {
      name: 'Английский',
      description: 'План занятий на квартал',
      color: '#059669',
      workspaceId: personal.id,
    },
  });

  await prisma.project.create({
    data: {
      name: 'Лендинг для клиента',
      description: 'Одностраничник с формой заявки',
      color: '#dc2626',
      workspaceId: studio.id,
    },
  });

  // Одна доска с колонками и карточками — понадобится на 2-м этапе.
  const board = await prisma.board.create({
    data: { name: 'Основная доска', order: 0, projectId: portfolio.id },
  });

  const todo = await prisma.boardColumn.create({
    data: { name: 'To Do', order: 0, boardId: board.id },
  });
  const inProgress = await prisma.boardColumn.create({
    data: { name: 'В работе', order: 1, boardId: board.id },
  });
  await prisma.boardColumn.create({
    data: { name: 'Готово', order: 2, boardId: board.id },
  });

  const card = await prisma.card.create({
    data: {
      title: 'Сверстать главную страницу',
      description: 'Шапка, список пространств, подвал',
      order: 0,
      priority: Priority.HIGH,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      columnId: todo.id,
      assignees: { create: [{ userId: yana.id }] },
    },
  });

  await prisma.comment.create({
    data: {
      body: 'Начну с макета в Figma',
      cardId: card.id,
      authorId: yana.id,
    },
  });

  await prisma.card.create({
    data: {
      title: 'Настроить API рабочих пространств',
      order: 0,
      priority: Priority.URGENT,
      columnId: inProgress.id,
      assignees: { create: [{ userId: alex.id }] },
    },
  });

  console.log('Готово. Демо-данные добавлены.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
