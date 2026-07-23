import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ChecklistService } from './checklist.service';
import { CreateChecklistItemDto } from './dto/create-checklist-item.dto';
import { UpdateChecklistItemDto } from './dto/update-checklist-item.dto';

@Controller('checklist')
export class ChecklistController {
  constructor(private readonly checklist: ChecklistService) {}

  /** POST /api/checklist */
  @Post()
  create(@Body() dto: CreateChecklistItemDto) {
    return this.checklist.create(dto);
  }

  /** PATCH /api/checklist/:id */
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateChecklistItemDto) {
    return this.checklist.update(id, dto);
  }

  /** PATCH /api/checklist/:id/toggle */
  @Patch(':id/toggle')
  toggle(@Param('id') id: string) {
    return this.checklist.toggle(id);
  }

  /** DELETE /api/checklist/:id */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.checklist.remove(id);
  }
}
