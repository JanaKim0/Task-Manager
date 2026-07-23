import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';

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

  private async ensureExists(id: string) {
    const count = await this.prisma.boardColumn.count({ where: { id } });
    if (count === 0) {
      throw new NotFoundException(`Column ${id} not found`);
    }
  }
}
