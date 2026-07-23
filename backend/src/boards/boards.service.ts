import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BoardsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns the whole board in a single request: columns, and inside each
   * column its cards. Without this the UI would need one request per column.
   */
  async findOne(id: string) {
    const board = await this.prisma.board.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true,
            workspaceId: true,
          },
        },
        columns: {
          orderBy: { order: 'asc' },
          include: {
            cards: {
              orderBy: [{ done: 'asc' }, { order: 'asc' }],
              include: { _count: { select: { comments: true } } },
            },
          },
        },
      },
    });

    if (!board) {
      throw new NotFoundException(`Board ${id} not found`);
    }
    return board;
  }

  findByProject(projectId: string) {
    return this.prisma.board.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
    });
  }
}
