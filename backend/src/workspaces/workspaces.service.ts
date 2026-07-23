import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.workspace.findMany({
      orderBy: { createdAt: 'asc' },
      // _count returns the number of related rows without loading them.
      include: { _count: { select: { projects: true } } },
    });
  }

  async findOne(id: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id },
      include: {
        projects: {
          orderBy: { createdAt: 'asc' },
          include: {
            // The first board is what the "Open board" link points at.
            boards: {
              orderBy: { order: 'asc' },
              select: { id: true, name: true, order: true, projectId: true },
            },
            _count: { select: { boards: true } },
          },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace ${id} not found`);
    }
    return workspace;
  }

  async create(dto: CreateWorkspaceDto) {
    try {
      return await this.prisma.workspace.create({ data: dto });
    } catch (error) {
      throw this.toHttpError(error, dto.slug);
    }
  }

  async update(id: string, dto: UpdateWorkspaceDto) {
    await this.ensureExists(id);
    try {
      return await this.prisma.workspace.update({ where: { id }, data: dto });
    } catch (error) {
      throw this.toHttpError(error, dto.slug);
    }
  }

  async remove(id: string) {
    await this.ensureExists(id);
    // The cascade rules in the schema delete projects, boards, columns and cards.
    return this.prisma.workspace.delete({ where: { id } });
  }

  private async ensureExists(id: string) {
    const count = await this.prisma.workspace.count({ where: { id } });
    if (count === 0) {
      throw new NotFoundException(`Workspace ${id} not found`);
    }
  }

  /** Turns a Prisma unique-constraint error into a readable HTTP 409. */
  private toHttpError(error: unknown, slug?: string) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return new ConflictException(`Slug "${slug}" is already taken`);
    }
    return error;
  }
}
