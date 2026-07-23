import { Controller, Get, Param, Query } from '@nestjs/common';
import { BoardsService } from './boards.service';

@Controller('boards')
export class BoardsController {
  constructor(private readonly boards: BoardsService) {}

  /** GET /api/boards?projectId=... */
  @Get()
  findByProject(@Query('projectId') projectId: string) {
    return this.boards.findByProject(projectId);
  }

  /** GET /api/boards/:id — the full board with columns and cards */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.boards.findOne(id);
  }
}
