import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { MoveCardDto } from './dto/move-card.dto';

@Injectable()
export class CardsService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(id: string) {
    const card = await this.prisma.card.findUnique({
      where: { id },
      include: {
        notes: { orderBy: { createdAt: 'desc' } },
        checklist: { orderBy: { order: 'asc' } },
      },
    });

    if (!card) {
      throw new NotFoundException(`Card ${id} not found`);
    }
    return card;
  }

  async create(dto: CreateCardDto) {
    const column = await this.prisma.boardColumn.count({
      where: { id: dto.columnId },
    });
    if (column === 0) {
      throw new BadRequestException(`Column ${dto.columnId} does not exist`);
    }

    const last = await this.prisma.card.findFirst({
      where: { columnId: dto.columnId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    return this.prisma.card.create({
      data: {
        title: dto.title,
        description: dto.description,
        priority: dto.priority,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        columnId: dto.columnId,
        order: last ? last.order + 1 : 0,
      },
      include: {
        checklist: { orderBy: { order: 'asc' } },
        _count: { select: { notes: true } },
      },
    });
  }

  async update(id: string, dto: UpdateCardDto) {
    const current = await this.prisma.card.findUnique({
      where: { id },
      select: { done: true },
    });
    if (!current) {
      throw new NotFoundException(`Card ${id} not found`);
    }

    const data: Prisma.CardUpdateInput = {};

    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.order !== undefined) data.order = dto.order;

    // dueDate is deliberately three-state: absent = leave as is,
    // null = clear the deadline, string = set a new one.
    if (dto.dueDate !== undefined) {
      data.dueDate = dto.dueDate === null ? null : new Date(dto.dueDate);
    }

    // completedAt is derived from `done`, the client never sets it directly.
    if (dto.done !== undefined && dto.done !== current.done) {
      data.done = dto.done;
      data.completedAt = dto.done ? new Date() : null;
    }

    if (dto.columnId !== undefined) {
      const column = await this.prisma.boardColumn.count({
        where: { id: dto.columnId },
      });
      if (column === 0) {
        throw new BadRequestException(`Column ${dto.columnId} does not exist`);
      }
      data.column = { connect: { id: dto.columnId } };
    }

    return this.prisma.card.update({
      where: { id },
      data,
      include: {
        checklist: { orderBy: { order: 'asc' } },
        _count: { select: { notes: true } },
      },
    });
  }

  /** Flips the done flag without the client having to know its current value. */
  async toggleDone(id: string) {
    const card = await this.prisma.card.findUnique({
      where: { id },
      select: { done: true },
    });
    if (!card) {
      throw new NotFoundException(`Card ${id} not found`);
    }

    return this.prisma.card.update({
      where: { id },
      data: {
        done: !card.done,
        completedAt: card.done ? null : new Date(),
      },
      include: {
        checklist: { orderBy: { order: 'asc' } },
        _count: { select: { notes: true } },
      },
    });
  }

  async remove(id: string) {
    const count = await this.prisma.card.count({ where: { id } });
    if (count === 0) {
      throw new NotFoundException(`Card ${id} not found`);
    }
    return this.prisma.card.delete({ where: { id } });
  }

  /**
   * Drops a card into `position` of a column, possibly a different one.
   *
   * Both affected columns are renumbered 0, 1, 2... so the order values
   * never drift apart or collide. It all runs inside one transaction:
   * either every row moves or none does, so a failure halfway through
   * cannot leave the board with two cards claiming the same slot.
   */
  async move(id: string, dto: MoveCardDto) {
    const card = await this.prisma.card.findUnique({
      where: { id },
      select: { id: true, columnId: true },
    });
    if (!card) {
      throw new NotFoundException(`Card ${id} not found`);
    }

    const targetColumnId = dto.columnId ?? card.columnId;

    if (targetColumnId !== card.columnId) {
      const exists = await this.prisma.boardColumn.count({
        where: { id: targetColumnId },
      });
      if (exists === 0) {
        throw new BadRequestException(`Column ${targetColumnId} does not exist`);
      }
    }

    await this.prisma.$transaction(async (tx) => {
      // The moving card is excluded so it can be spliced back in cleanly.
      const sourceIds = (
        await tx.card.findMany({
          where: { columnId: card.columnId, id: { not: id } },
          orderBy: { order: 'asc' },
          select: { id: true },
        })
      ).map((c) => c.id);

      if (targetColumnId === card.columnId) {
        sourceIds.splice(this.clamp(dto.position, sourceIds.length), 0, id);
        await this.renumber(tx, sourceIds);
        return;
      }

      const targetIds = (
        await tx.card.findMany({
          where: { columnId: targetColumnId },
          orderBy: { order: 'asc' },
          select: { id: true },
        })
      ).map((c) => c.id);

      targetIds.splice(this.clamp(dto.position, targetIds.length), 0, id);

      await tx.card.update({
        where: { id },
        data: { columnId: targetColumnId },
      });
      await this.renumber(tx, sourceIds);
      await this.renumber(tx, targetIds);
    });

    return this.prisma.card.findUnique({
      where: { id },
      include: {
        checklist: { orderBy: { order: 'asc' } },
        _count: { select: { notes: true } },
      },
    });
  }

  /** Writes 0, 1, 2... into the order column, following the given sequence. */
  private async renumber(tx: Prisma.TransactionClient, ids: string[]) {
    for (let index = 0; index < ids.length; index++) {
      await tx.card.update({
        where: { id: ids[index] },
        data: { order: index },
      });
    }
  }

  /** Keeps a requested position inside the bounds of the list. */
  private clamp(position: number, length: number): number {
    return Math.max(0, Math.min(position, length));
  }
}
