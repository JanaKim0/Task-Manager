import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ColumnsService } from './columns.service';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';

@Controller('columns')
export class ColumnsController {
  constructor(private readonly columns: ColumnsService) {}

  /** POST /api/columns */
  @Post()
  create(@Body() dto: CreateColumnDto) {
    return this.columns.create(dto);
  }

  /** PATCH /api/columns/:id */
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateColumnDto) {
    return this.columns.update(id, dto);
  }

  /** DELETE /api/columns/:id */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.columns.remove(id);
  }
}
