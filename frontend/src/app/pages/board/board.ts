import { Component, computed, inject, Input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { BoardService } from '../../core/board.service';
import {
  Board,
  BoardColumn,
  BoardFilters,
  Card,
  ChecklistItem,
  DueFilter,
  EMPTY_FILTERS,
  Note,
  Priority,
  PRIORITIES,
  PRIORITY_LABELS,
} from '../../core/models';
import { readHttpError } from '../../core/http-error';

/** How a deadline should be shown to the user. */
type DueState = 'overdue' | 'today' | 'soon' | 'later' | 'none';

@Component({
  selector: 'app-board',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './board.html',
  styleUrl: './board.scss',
})
export class BoardComponent implements OnInit {
  @Input() id!: string;

  private readonly api = inject(BoardService);
  private readonly fb = inject(FormBuilder);

  readonly board = signal<Board | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly saving = signal(false);

  /** Which column currently shows the inline "add card" input. */
  readonly addingToColumn = signal<string | null>(null);
  readonly newCardTitle = signal('');

  readonly showColumnForm = signal(false);
  readonly newColumnName = signal('');

  // ---------- card editor state ----------

  /** The card open in the editor dialog, or null when it is closed. */
  readonly editingCard = signal<Card | null>(null);
  readonly editorLoading = signal(false);
  readonly notes = signal<Note[]>([]);
  readonly checklist = signal<ChecklistItem[]>([]);
  readonly newNote = signal('');
  readonly newChecklistItem = signal('');

  // ---------- filters ----------

  readonly filters = signal<BoardFilters>({ ...EMPTY_FILTERS });

  readonly priorities = PRIORITIES;
  readonly priorityLabels = PRIORITY_LABELS;
  readonly dueFilters: { value: DueFilter; label: string }[] = [
    { value: 'any', label: 'Any date' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'week', label: 'Next 7 days' },
    { value: 'none', label: 'No deadline' },
  ];

  readonly columns = computed(() => this.board()?.columns ?? []);

  /**
   * Columns with their cards run through the filters.
   * This is a computed signal, so filtering happens instantly in the
   * browser — no request to the server on every keystroke.
   */
  readonly visibleColumns = computed(() => {
    const filters = this.filters();
    return this.columns().map((column) => ({
      ...column,
      cards: column.cards.filter((card) => this.matches(card, filters)),
    }));
  });

  readonly filtersActive = computed(() => {
    const f = this.filters();
    return (
      f.search.trim() !== '' ||
      f.priority !== 'any' ||
      f.due !== 'any' ||
      f.hideDone
    );
  });

  readonly totalCards = computed(() =>
    this.columns().reduce((sum, column) => sum + column.cards.length, 0),
  );

  readonly doneCards = computed(() =>
    this.columns().reduce(
      (sum, column) => sum + column.cards.filter((c) => c.done).length,
      0,
    ),
  );

  readonly visibleCards = computed(() =>
    this.visibleColumns().reduce((sum, column) => sum + column.cards.length, 0),
  );

  /**
   * Progress of the checklist inside the open dialog. Derived from the
   * `checklist` signal rather than from the card, so it updates the moment
   * an item is added or ticked.
   */
  readonly editorProgress = computed(() => {
    const items = this.checklist();
    if (items.length === 0) {
      return '';
    }
    return `${items.filter((i) => i.done).length}/${items.length}`;
  });

  readonly cardForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(1)]],
    description: [''],
    dueDate: [''],
    priority: ['MEDIUM' as Priority, Validators.required],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.api.getBoard(this.id).subscribe({
      next: (board) => {
        this.board.set(board);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(readHttpError(err));
        this.loading.set(false);
      },
    });
  }

  // ---------- filters ----------

  setSearch(value: string): void {
    this.filters.update((f) => ({ ...f, search: value }));
  }

  setPriority(value: string): void {
    this.filters.update((f) => ({
      ...f,
      priority: value as Priority | 'any',
    }));
  }

  setDue(value: string): void {
    this.filters.update((f) => ({ ...f, due: value as DueFilter }));
  }

  toggleHideDone(): void {
    this.filters.update((f) => ({ ...f, hideDone: !f.hideDone }));
  }

  resetFilters(): void {
    this.filters.set({ ...EMPTY_FILTERS });
  }

  /** True when a card survives every active filter. */
  private matches(card: Card, filters: BoardFilters): boolean {
    if (filters.hideDone && card.done) {
      return false;
    }

    if (filters.priority !== 'any' && card.priority !== filters.priority) {
      return false;
    }

    const search = filters.search.trim().toLowerCase();
    if (search) {
      const haystack = `${card.title} ${card.description ?? ''}`.toLowerCase();
      if (!haystack.includes(search)) {
        return false;
      }
    }

    if (filters.due === 'none' && card.dueDate) {
      return false;
    }
    if (filters.due === 'overdue') {
      if (!card.dueDate || card.done || this.daysUntil(card.dueDate) >= 0) {
        return false;
      }
    }
    if (filters.due === 'week') {
      if (!card.dueDate) {
        return false;
      }
      const days = this.daysUntil(card.dueDate);
      if (days < 0 || days > 7) {
        return false;
      }
    }

    return true;
  }

  // ---------- columns ----------

  openColumnForm(): void {
    this.showColumnForm.set(true);
    this.newColumnName.set('');
  }

  addColumn(): void {
    const name = this.newColumnName().trim();
    if (!name) {
      return;
    }

    this.api.createColumn({ name, boardId: this.id }).subscribe({
      next: (column) => {
        this.patchBoard((board) => ({
          ...board,
          columns: [...(board.columns ?? []), { ...column, cards: [] }],
        }));
        this.showColumnForm.set(false);
        this.newColumnName.set('');
      },
      error: (err: HttpErrorResponse) => this.error.set(readHttpError(err)),
    });
  }

  removeColumn(column: BoardColumn): void {
    const warning = column.cards.length
      ? `Delete "${column.name}" and its ${column.cards.length} card(s)?`
      : `Delete "${column.name}"?`;
    if (!confirm(warning)) {
      return;
    }

    this.api.removeColumn(column.id).subscribe({
      next: () =>
        this.patchBoard((board) => ({
          ...board,
          columns: (board.columns ?? []).filter((c) => c.id !== column.id),
        })),
      error: (err: HttpErrorResponse) => this.error.set(readHttpError(err)),
    });
  }

  // ---------- creating cards ----------

  startAddCard(columnId: string): void {
    this.addingToColumn.set(columnId);
    this.newCardTitle.set('');
  }

  cancelAddCard(): void {
    this.addingToColumn.set(null);
    this.newCardTitle.set('');
  }

  addCard(columnId: string): void {
    const title = this.newCardTitle().trim();
    if (!title) {
      return;
    }

    // A quick-added card has no deadline — that is set later in the editor.
    this.api.createCard({ title, columnId }).subscribe({
      next: (card) => {
        this.updateColumn(columnId, (column) => ({
          ...column,
          cards: [...column.cards, { ...card, checklist: card.checklist ?? [] }],
        }));
        this.newCardTitle.set('');
      },
      error: (err: HttpErrorResponse) => this.error.set(readHttpError(err)),
    });
  }

  // ---------- editing cards ----------

  openEditor(card: Card): void {
    this.editingCard.set(card);
    this.cardForm.setValue({
      title: card.title,
      description: card.description ?? '',
      dueDate: this.toDateInput(card.dueDate),
      priority: card.priority,
    });

    // The board response carries the checklist but not the notes,
    // so the full card is fetched when the dialog opens.
    this.checklist.set(card.checklist ?? []);
    this.notes.set([]);
    this.editorLoading.set(true);

    this.api.getCard(card.id).subscribe({
      next: (full) => {
        this.notes.set(full.notes ?? []);
        this.checklist.set(full.checklist ?? []);
        this.editorLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(readHttpError(err));
        this.editorLoading.set(false);
      },
    });
  }

  closeEditor(): void {
    this.editingCard.set(null);
    this.notes.set([]);
    this.checklist.set([]);
    this.newNote.set('');
    this.newChecklistItem.set('');
    this.cardForm.reset({ priority: 'MEDIUM' });
  }

  saveCard(): void {
    const card = this.editingCard();
    if (!card || this.cardForm.invalid) {
      this.cardForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const { title, description, dueDate, priority } = this.cardForm.getRawValue();

    this.api
      .updateCard(card.id, {
        title: title.trim(),
        description: description.trim() || null,
        // An empty input means "no deadline", which the API takes as null.
        dueDate: dueDate ? this.fromDateInput(dueDate) : null,
        priority,
      })
      .subscribe({
        next: (updated) => {
          this.replaceCard({ ...updated, checklist: this.checklist() });
          this.saving.set(false);
          this.closeEditor();
        },
        error: (err: HttpErrorResponse) => {
          this.error.set(readHttpError(err));
          this.saving.set(false);
        },
      });
  }

  /** Clears the deadline straight from the editor. */
  clearDueDate(): void {
    this.cardForm.controls.dueDate.setValue('');
  }

  toggleDone(card: Card): void {
    // Optimistic update: flip it on screen first, roll back if the call fails.
    this.replaceCard({ ...card, done: !card.done });

    this.api.toggleCard(card.id).subscribe({
      next: (updated) =>
        this.replaceCard({ ...updated, checklist: card.checklist }),
      error: (err: HttpErrorResponse) => {
        this.replaceCard(card);
        this.error.set(readHttpError(err));
      },
    });
  }

  removeCard(card: Card): void {
    if (!confirm(`Delete "${card.title}"?`)) {
      return;
    }

    this.api.removeCard(card.id).subscribe({
      next: () =>
        this.updateColumn(card.columnId, (column) => ({
          ...column,
          cards: column.cards.filter((c) => c.id !== card.id),
        })),
      error: (err: HttpErrorResponse) => this.error.set(readHttpError(err)),
    });
  }

  // ---------- notes ----------

  addNote(): void {
    const card = this.editingCard();
    const body = this.newNote().trim();
    if (!card || !body) {
      return;
    }

    this.api.createNote({ body, cardId: card.id }).subscribe({
      next: (note) => {
        // Newest first, matching the order the API returns them in.
        this.notes.update((list) => [note, ...list]);
        this.newNote.set('');
        this.bumpNoteCount(card.id, 1);
      },
      error: (err: HttpErrorResponse) => this.error.set(readHttpError(err)),
    });
  }

  removeNote(note: Note): void {
    this.api.removeNote(note.id).subscribe({
      next: () => {
        this.notes.update((list) => list.filter((n) => n.id !== note.id));
        this.bumpNoteCount(note.cardId, -1);
      },
      error: (err: HttpErrorResponse) => this.error.set(readHttpError(err)),
    });
  }

  // ---------- checklist ----------

  addChecklistItem(): void {
    const card = this.editingCard();
    const text = this.newChecklistItem().trim();
    if (!card || !text) {
      return;
    }

    this.api.createChecklistItem({ text, cardId: card.id }).subscribe({
      next: (item) => {
        const next = [...this.checklist(), item];
        this.checklist.set(next);
        this.syncChecklist(card.id, next);
        this.newChecklistItem.set('');
      },
      error: (err: HttpErrorResponse) => this.error.set(readHttpError(err)),
    });
  }

  toggleChecklistItem(item: ChecklistItem): void {
    const card = this.editingCard();

    this.api.toggleChecklistItem(item.id).subscribe({
      next: (updated) => {
        const next = this.checklist().map((i) =>
          i.id === updated.id ? updated : i,
        );
        this.checklist.set(next);
        if (card) {
          this.syncChecklist(card.id, next);
        }
      },
      error: (err: HttpErrorResponse) => this.error.set(readHttpError(err)),
    });
  }

  removeChecklistItem(item: ChecklistItem): void {
    const card = this.editingCard();

    this.api.removeChecklistItem(item.id).subscribe({
      next: () => {
        const next = this.checklist().filter((i) => i.id !== item.id);
        this.checklist.set(next);
        if (card) {
          this.syncChecklist(card.id, next);
        }
      },
      error: (err: HttpErrorResponse) => this.error.set(readHttpError(err)),
    });
  }

  /** "2/5" for the badge on a card, or an empty string when there is no list. */
  checklistProgress(card: Card): string {
    const items = card.checklist ?? [];
    if (items.length === 0) {
      return '';
    }
    return `${items.filter((i) => i.done).length}/${items.length}`;
  }

  checklistComplete(card: Card): boolean {
    const items = card.checklist ?? [];
    return items.length > 0 && items.every((i) => i.done);
  }

  // ---------- deadlines ----------

  /** Classifies a deadline so the template can colour it. */
  dueState(card: Card): DueState {
    if (!card.dueDate) {
      return 'none';
    }
    if (card.done) {
      return 'later';
    }

    const diff = this.daysUntil(card.dueDate);
    if (diff < 0) return 'overdue';
    if (diff === 0) return 'today';
    if (diff <= 2) return 'soon';
    return 'later';
  }

  /** Short human label: "Today", "Tomorrow", "2 days late", "24 Jul". */
  dueLabel(card: Card): string {
    if (!card.dueDate) {
      return '';
    }

    const diff = this.daysUntil(card.dueDate);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff === -1) return '1 day late';
    if (diff < -1) return `${Math.abs(diff)} days late`;

    return new Date(card.dueDate).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    });
  }

  noteDate(note: Note): string {
    return new Date(note.createdAt).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /** Whole days between today and the deadline, ignoring the time of day. */
  private daysUntil(iso: string): number {
    const due = new Date(iso);
    const dueMidnight = new Date(
      due.getFullYear(),
      due.getMonth(),
      due.getDate(),
    );

    const now = new Date();
    const todayMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.round(
      (dueMidnight.getTime() - todayMidnight.getTime()) / msPerDay,
    );
  }

  /** ISO date from the server -> "YYYY-MM-DD" for <input type="date">. */
  private toDateInput(iso: string | null): string {
    if (!iso) {
      return '';
    }
    const date = new Date(iso);
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }

  /**
   * "YYYY-MM-DD" -> ISO string. Anchored at midday local time so the date
   * never slips to the previous day when converted to UTC.
   */
  private fromDateInput(value: string): string {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0).toISOString();
  }

  // ---------- local state helpers ----------

  /** Keeps the badge on the board in step with the editor's checklist. */
  private syncChecklist(cardId: string, items: ChecklistItem[]): void {
    this.patchBoard((board) => ({
      ...board,
      columns: (board.columns ?? []).map((column) => ({
        ...column,
        cards: column.cards.map((c) =>
          c.id === cardId ? { ...c, checklist: items } : c,
        ),
      })),
    }));
  }

  private bumpNoteCount(cardId: string, delta: number): void {
    this.patchBoard((board) => ({
      ...board,
      columns: (board.columns ?? []).map((column) => ({
        ...column,
        cards: column.cards.map((c) =>
          c.id === cardId
            ? { ...c, _count: { notes: (c._count?.notes ?? 0) + delta } }
            : c,
        ),
      })),
    }));
  }

  /** Replaces one card wherever it currently sits on the board. */
  private replaceCard(card: Card): void {
    this.patchBoard((board) => ({
      ...board,
      columns: (board.columns ?? []).map((column) => ({
        ...column,
        cards: column.cards.map((c) => (c.id === card.id ? card : c)),
      })),
    }));
  }

  private updateColumn(
    columnId: string,
    change: (column: BoardColumn) => BoardColumn,
  ): void {
    this.patchBoard((board) => ({
      ...board,
      columns: (board.columns ?? []).map((column) =>
        column.id === columnId ? change(column) : column,
      ),
    }));
  }

  private patchBoard(change: (board: Board) => Board): void {
    this.board.update((board) => (board ? change(board) : board));
  }
}
