import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChecklistItemDto } from './dto/create-checklist-item.dto';
import { UpdateChecklistItemDto } from './dto/update-checklist-item.dto';

@Injectable()
export class ChecklistService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateChecklistItemDto) {
    const card = await this.prisma.card.count({ where: { id: dto.cardId } });
    if (card === 0) {
      throw new BadRequestException(`Card ${dto.cardId} does not exist`);
    }

    // New items go to the bottom of the list.
    const last = await this.prisma.checklistItem.findFirst({
      where: { cardId: dto.cardId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    return this.prisma.checklistItem.create({
      data: {
        text: dto.text.trim(),
        cardId: dto.cardId,
        order: last ? last.order + 1 : 0,
      },
    });
  }

  async update(id: string, dto: UpdateChecklistItemDto) {
    await this.ensureExists(id);
    return this.prisma.checklistItem.update({ where: { id }, data: dto });
  }

  /** Flips done without the client needing to know the current value. */
  async toggle(id: string) {
    const item = await this.prisma.checklistItem.findUnique({
      where: { id },
      select: { done: true },
    });
    if (!item) {
      throw new NotFoundException(`Checklist item ${id} not found`);
    }

    return this.prisma.checklistItem.update({
      where: { id },
      data: { done: !item.done },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    return this.prisma.checklistItem.delete({ where: { id } });
  }

  private async ensureExists(id: string) {
    const count = await this.prisma.checklistItem.count({ where: { id } });
    if (count === 0) {
      throw new NotFoundException(`Checklist item ${id} not found`);
    }
  }
}
