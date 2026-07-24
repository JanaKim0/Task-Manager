import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { ProjectsModule } from './projects/projects.module';
import { BoardsModule } from './boards/boards.module';
import { ColumnsModule } from './columns/columns.module';
import { CardsModule } from './cards/cards.module';
import { NotesModule } from './notes/notes.module';
import { ChecklistModule } from './checklist/checklist.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    WorkspacesModule,
    ProjectsModule,
    BoardsModule,
    ColumnsModule,
    CardsModule,
    NotesModule,
    ChecklistModule,
  ],
})
export class AppModule {}
