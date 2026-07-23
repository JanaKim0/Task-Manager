import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Все проекты, при указании workspaceId — только внутри одного пространства. */
  findAll(workspaceId?: string) {
    return this.prisma.project.findMany({
      where: workspaceId ? { workspaceId } : undefined,
      orderBy: { createdAt: 'asc' },
      include: {
        workspace: { select: { id: true, name: true, slug: true } },
        _count: { select: { boards: true } },
      },
    });
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
      throw new NotFoundException(`Проект ${id} не найден`);
    }
    return project;
  }

  async create(dto: CreateProjectDto) {
    // Проверяем родителя заранее, чтобы вернуть 400, а не ошибку внешнего ключа.
    const exists = await this.prisma.workspace.count({
      where: { id: dto.workspaceId },
    });
    if (exists === 0) {
      throw new BadRequestException(
        `Рабочее пространство ${dto.workspaceId} не существует`,
      );
    }

    return this.prisma.project.create({ data: dto });
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
      throw new NotFoundException(`Проект ${id} не найден`);
    }
  }
}
