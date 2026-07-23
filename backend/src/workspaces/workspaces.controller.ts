import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspaces: WorkspacesService) {}

  /** GET /api/workspaces */
  @Get()
  findAll() {
    return this.workspaces.findAll();
  }

  /** GET /api/workspaces/:id — вместе с проектами и участниками */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workspaces.findOne(id);
  }

  /** POST /api/workspaces */
  @Post()
  create(@Body() dto: CreateWorkspaceDto) {
    return this.workspaces.create(dto);
  }

  /** PATCH /api/workspaces/:id */
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWorkspaceDto) {
    return this.workspaces.update(id, dto);
  }

  /** DELETE /api/workspaces/:id */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.workspaces.remove(id);
  }
}
