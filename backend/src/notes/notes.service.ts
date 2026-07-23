import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNoteDto } from './dto/create-note.dto';

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

  async remove(id: string) {
    const count = await this.prisma.note.count({ where: { id } });
    if (count === 0) {
      throw new NotFoundException(`Note ${id} not found`);
    }
    return this.prisma.note.delete({ where: { id } });
  }
}
