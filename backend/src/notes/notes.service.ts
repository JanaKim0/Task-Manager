import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNoteDto, UpdateNoteDto } from './dto/create-note.dto';

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateNoteDto) {
    const card = await this.prisma.card.count({ where: { id: dto.cardId } });
    if (card === 0) {
      throw new BadRequestException(`Card ${dto.cardId} does not exist`);
    }

    return this.prisma.note.create({
      data: { body: dto.body.trim(), cardId: dto.cardId },
    });
  }

  async update(id: string, dto: UpdateNoteDto) {
    await this.ensureExists(id);
    return this.prisma.note.update({
      where: { id },
      data: { body: dto.body.trim() },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    return this.prisma.note.delete({ where: { id } });
  }

  private async ensureExists(id: string) {
    const count = await this.prisma.note.count({ where: { id } });
    if (count === 0) {
      throw new NotFoundException(`Note ${id} not found`);
    }
  }
}
