/**
 * Shapes of the data returned by the backend.
 * Kept in one place so components never redeclare them.
 *
 * This is a single-user app: there are no accounts or assignees.
 */

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export const PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  // present in the list response only
  _count?: { projects: number };
  // present in the detail response only
  projects?: Project[];
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
  project?: Pick<Project, 'id' | 'name' | 'color' | 'workspaceId'>;
  columns?: BoardColumn[];
}

export interface BoardColumn {
  id: string;
  name: string;
  order: number;
  boardId: string;
  cards: Card[];
}

export interface Card {
  id: string;
  title: string;
  description: string | null;
  order: number;
  dueDate: string | null;
  priority: Priority;
  done: boolean;
  completedAt: string | null;
  columnId: string;
  createdAt: string;
  updatedAt: string;
  // Checklist items travel with the board so cards can show "2/5".
  checklist: ChecklistItem[];
  // Notes are only loaded when a card is opened.
  notes?: Note[];
  _count?: { notes: number };
}

/** A personal note on a card. Not a comment — there is only one user. */
export interface Note {
  id: string;
  body: string;
  createdAt: string;
  cardId: string;
}

/** A sub-task inside a card, ticked independently of the card itself. */
export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
  order: number;
  cardId: string;
  createdAt: string;
}

// ---------- request bodies ----------

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

export interface CreateColumnDto {
  name: string;
  boardId: string;
}

export interface UpdateColumnDto {
  name?: string;
  order?: number;
}

export interface CreateCardDto {
  title: string;
  description?: string;
  dueDate?: string | null;
  priority?: Priority;
  columnId: string;
}

export interface UpdateCardDto {
  title?: string;
  description?: string | null;
  dueDate?: string | null;
  priority?: Priority;
  done?: boolean;
  order?: number;
  columnId?: string;
}

export interface CreateNoteDto {
  body: string;
  cardId: string;
}

export interface CreateChecklistItemDto {
  text: string;
  cardId: string;
}

// ---------- board filters (client side only) ----------

export type DueFilter = 'any' | 'overdue' | 'week' | 'none';

export interface BoardFilters {
  search: string;
  priority: Priority | 'any';
  due: DueFilter;
  hideDone: boolean;
}

export const EMPTY_FILTERS: BoardFilters = {
  search: '',
  priority: 'any',
  due: 'any',
  hideDone: false,
};
