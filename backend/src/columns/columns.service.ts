import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { ReorderColumnsDto } from './dto/reorder-columns.dto';

@Injectable()
export class ColumnsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateColumnDto) {
    const board = await this.prisma.board.count({ where: { id: dto.boardId } });
    if (board === 0) {
      throw new BadRequestException(`Board ${dto.boardId} does not exist`);
    }

    // New columns go to the end: take the current highest order and add one.
    const last = await this.prisma.boardColumn.findFirst({
      where: { boardId: dto.boardId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    return this.prisma.boardColumn.create({
      data: {
        name: dto.name,
        boardId: dto.boardId,
        order: last ? last.order + 1 : 0,
      },
      include: { cards: true },
    });
  }

  async update(id: string, dto: UpdateColumnDto) {
    await this.ensureExists(id);
    return this.prisma.boardColumn.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    // Cards inside the column are removed by the cascade rule.
    return this.prisma.boardColumn.delete({ where: { id } });
  }

  /**
   * Rewrites the order of every column on a board in one transaction.
   * The client sends the full sequence, so there is no arithmetic to get
   * wrong on either side.
   */
  async reorder(dto: ReorderColumnsDto) {
    const columns = await this.prisma.boardColumn.findMany({
      where: { boardId: dto.boardId },
      select: { id: true },
    });

    const known = new Set(columns.map((c) => c.id));
    const incoming = new Set(dto.orderedIds);

    if (
      known.size !== incoming.size ||
      dto.orderedIds.some((id) => !known.has(id))
    ) {
      throw new BadRequestException(
        'orderedIds must list every column of this board exactly once',
      );
    }

    await this.prisma.$transaction(
      dto.orderedIds.map((id, index) =>
        this.prisma.boardColumn.update({
          where: { id },
          data: { order: index },
        }),
      ),
    );

    return this.prisma.boardColumn.findMany({
      where: { boardId: dto.boardId },
      orderBy: { order: 'asc' },
    });
  }

  private async ensureExists(id: string) {
    const count = await this.prisma.boardColumn.count({ where: { id } });
    if (count === 0) {
      throw new NotFoundException(`Column ${id} not found`);
    }
  }
}
