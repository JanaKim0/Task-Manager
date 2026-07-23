/**
 * Типы данных, которые приходят с backend.
 * Держим их в одном месте, чтобы не дублировать по компонентам.
 */

export type Role = 'OWNER' | 'ADMIN' | 'MEMBER';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export interface Membership {
  id: string;
  role: Role;
  userId: string;
  workspaceId: string;
  user?: User;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  // приходит только из списка (GET /workspaces)
  _count?: { projects: number; members: number };
  // приходят только из карточки (GET /workspaces/:id)
  projects?: Project[];
  members?: Membership[];
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  workspace?: Pick<Workspace, 'id' | 'name' | 'slug'>;
  boards?: Board[];
  _count?: { boards: number };
}

export interface Board {
  id: string;
  name: string;
  order: number;
  projectId: string;
}

// Тела запросов на создание/изменение

export interface CreateWorkspaceDto {
  name: string;
  slug: string;
  description?: string;
}

export type UpdateWorkspaceDto = Partial<CreateWorkspaceDto>;

export interface CreateProjectDto {
  name: string;
  description?: string;
  color?: string;
  workspaceId: string;
}

export type UpdateProjectDto = Partial<Omit<CreateProjectDto, 'workspaceId'>>;
