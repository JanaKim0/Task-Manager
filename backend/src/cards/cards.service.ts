import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';

@Injectable()
export class CardsService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(id: string) {
    const card = await this.prisma.card.findUnique({
      where: { id },
      include: { comments: { orderBy: { createdAt: 'asc' } } },
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
      include: { _count: { select: { comments: true } } },
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
      include: { _count: { select: { comments: true } } },
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
      include: { _count: { select: { comments: true } } },
    });
  }

  async remove(id: string) {
    const count = await this.prisma.card.count({ where: { id } });
    if (count === 0) {
      throw new NotFoundException(`Card ${id} not found`);
    }
    return this.prisma.card.delete({ where: { id } });
  }
}
