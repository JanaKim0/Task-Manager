import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Answers one question for the workspace and project lists: is anything
 * inside about to run out of time?
 *
 * The lists show a dot rather than a count, so a set of ids is all they
 * need — no reason to load the cards themselves.
 */
@Injectable()
export class DeadlinesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Projects holding at least one card that is running out of time. */
  async projectsAtRisk(workspaceId?: string): Promise<Set<string>> {
    const cards = await this.prisma.card.findMany({
      where: this.atRisk(workspaceId),
      select: { column: { select: { board: { select: { projectId: true } } } } },
    });

    return new Set(cards.map((card) => card.column.board.projectId));
  }

  /** The same question one level up, for the list of workspaces. */
  async workspacesAtRisk(): Promise<Set<string>> {
    const cards = await this.prisma.card.findMany({
      where: this.atRisk(),
      select: {
        column: {
          select: {
            board: { select: { project: { select: { workspaceId: true } } } },
          },
        },
      },
    });

    return new Set(cards.map((card) => card.column.board.project.workspaceId));
  }

  /**
   * A card counts when it is still open and its deadline is today, tomorrow,
   * the day after — or already gone. The same two days the board uses to
   * colour a deadline, so the dot and the card never disagree.
   */
  private atRisk(workspaceId?: string): Prisma.CardWhereInput {
    return {
      done: false,
      dueDate: { not: null, lte: endOfDayIn(2) },
      column: workspaceId
        ? { board: { project: { workspaceId } } }
        : undefined,
    };
  }
}

/** The last moment of the day `days` from now, in the server's timezone. */
function endOfDayIn(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(23, 59, 59, 999);
  return date;
}
