import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto, UpdateNoteDto } from './dto/create-note.dto';

@Controller('notes')
export class NotesController {
  constructor(private readonly notes: NotesService) {}

  /** POST /api/notes — notes are read as part of GET /api/cards/:id */
  @Post()
  create(@Body() dto: CreateNoteDto) {
    return this.notes.create(dto);
  }

  /** PATCH /api/notes/:id */
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateNoteDto) {
    return this.notes.update(id, dto);
  }

  /** DELETE /api/notes/:id */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.notes.remove(id);
  }
}
