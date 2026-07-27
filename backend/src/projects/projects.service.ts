import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DeadlinesService } from '../deadlines/deadlines.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly deadlines: DeadlinesService,
  ) {}

  /** All projects, or only those inside one workspace when an id is given. */
  async findAll(workspaceId?: string) {
    const [projects, atRisk] = await Promise.all([
      this.prisma.project.findMany({
        where: workspaceId ? { workspaceId } : undefined,
        orderBy: { createdAt: 'asc' },
        include: {
          workspace: { select: { id: true, name: true, slug: true } },
          _count: { select: { boards: true } },
        },
      }),
      this.deadlines.projectsAtRisk(workspaceId),
    ]);

    // dueSoon drives the dot on the card in the list.
    return projects.map((project) => ({
      ...project,
      dueSoon: atRisk.has(project.id),
    }));
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        workspace: { select: { id: true, name: true, slug: true } },
        boards: { orderBy: { order: 'asc' } },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project ${id} not found`);
    }
    return project;
  }

  async create(dto: CreateProjectDto) {
    // Check the parent up front so we return a clear 400 instead of a
    // raw foreign-key error from the database.
    const exists = await this.prisma.workspace.count({
      where: { id: dto.workspaceId },
    });
    if (exists === 0) {
      throw new BadRequestException(
        `Workspace ${dto.workspaceId} does not exist`,
      );
    }

    const project = await this.prisma.project.create({ data: dto });

    // Every project gets a default board, so the user never lands on an
    // empty screen. There is no "Done" column on purpose: a card is finished
    // when its checkbox is ticked, and the board filter hides it from view.
    await this.prisma.board.create({
      data: {
        name: 'Main board',
        order: 0,
        projectId: project.id,
        columns: {
          create: [
            { name: 'To do', order: 0 },
            { name: 'In progress', order: 1 },
          ],
        },
      },
    });

    return this.findOne(project.id);
  }

  async update(id: string, dto: UpdateProjectDto) {
    await this.ensureExists(id);
    return this.prisma.project.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    return this.prisma.project.delete({ where: { id } });
  }

  private async ensureExists(id: string) {
    const count = await this.prisma.project.count({ where: { id } });
    if (count === 0) {
      throw new NotFoundException(`Project ${id} not found`);
    }
  }
}
