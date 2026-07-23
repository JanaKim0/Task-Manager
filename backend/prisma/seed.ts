/**
 * Fills the database with demo data so the app never opens empty.
 * Run: npm run seed
 */
import 'dotenv/config';
import { PrismaClient, Priority } from '@prisma/client';

const prisma = new PrismaClient();

/** Returns a date N days from now, or null for "no deadline". */
function inDays(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

async function main() {
  console.log('Clearing the database...');
  // Order matters: children first, then parents.
  await prisma.comment.deleteMany();
  await prisma.card.deleteMany();
  await prisma.boardColumn.deleteMany();
  await prisma.board.deleteMany();
  await prisma.project.deleteMany();
  await prisma.workspace.deleteMany();

  console.log('Creating workspaces...');
  const personal = await prisma.workspace.create({
    data: {
      name: 'Personal',
      slug: 'personal',
      description: 'Study plans and everyday tasks',
    },
  });

  const freelance = await prisma.workspace.create({
    data: {
      name: 'Freelance',
      slug: 'freelance',
      description: 'Client work',
    },
  });

  console.log('Creating projects...');
  const portfolio = await prisma.project.create({
    data: {
      name: 'Portfolio',
      description: 'Six pet projects in one month',
      color: '#e8749c',
      workspaceId: personal.id,
    },
  });

  await prisma.project.create({
    data: {
      name: 'Serbian language',
      description: 'Lesson plan for the quarter',
      color: '#7cc4a4',
      workspaceId: personal.id,
    },
  });

  await prisma.project.create({
    data: {
      name: 'Landing page',
      description: 'One-pager with a contact form',
      color: '#f0a868',
      workspaceId: freelance.id,
    },
  });

  console.log('Creating a board with columns and cards...');
  const board = await prisma.board.create({
    data: { name: 'Main board', order: 0, projectId: portfolio.id },
  });

  const todo = await prisma.boardColumn.create({
    data: { name: 'To do', order: 0, boardId: board.id },
  });
  const doing = await prisma.boardColumn.create({
    data: { name: 'In progress', order: 1, boardId: board.id },
  });
  const done = await prisma.boardColumn.create({
    data: { name: 'Done', order: 2, boardId: board.id },
  });

  const designCard = await prisma.card.create({
    data: {
      title: 'Design the landing page',
      description: 'Header, workspace list, footer',
      order: 0,
      priority: Priority.HIGH,
      dueDate: inDays(3),
      columnId: todo.id,
    },
  });

  await prisma.comment.create({
    data: { body: 'Start with a Figma mockup', cardId: designCard.id },
  });

  await prisma.card.create({
    data: {
      title: 'Write the README',
      description: null,
      order: 1,
      priority: Priority.LOW,
      // No dueDate: a card without a deadline is perfectly fine.
      columnId: todo.id,
    },
  });

  await prisma.card.create({
    data: {
      title: 'Build the cards API',
      order: 0,
      priority: Priority.URGENT,
      dueDate: inDays(1),
      columnId: doing.id,
    },
  });

  await prisma.card.create({
    data: {
      title: 'Set up the database schema',
      order: 0,
      priority: Priority.MEDIUM,
      done: true,
      completedAt: new Date(),
      columnId: done.id,
    },
  });

  console.log('Done. Demo data created.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
