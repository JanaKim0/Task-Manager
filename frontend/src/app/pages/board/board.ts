import { Component, computed, inject, Input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
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
} from '../../core/models';
import { readHttpError } from '../../core/http-error';
import { ConfirmService } from '../../core/confirm.service';
import { SettingsService } from '../../core/settings.service';
import { fill } from '../../core/i18n';

/** How a deadline should be shown to the user. */
type DueState = 'overdue' | 'today' | 'soon' | 'later' | 'none';

@Component({
  selector: 'app-board',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    CdkDrag,
    CdkDragHandle,
    CdkDropList,
  ],
  templateUrl: './board.html',
  styleUrl: './board.scss',
})
export class BoardComponent implements OnInit {
  @Input() id!: string;

  private readonly api = inject(BoardService);
  private readonly fb = inject(FormBuilder);
  private readonly confirm = inject(ConfirmService);
  private readonly settings = inject(SettingsService);

  readonly t = this.settings.t;

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
  readonly dueFilterValues: DueFilter[] = ['any', 'overdue', 'week', 'none'];

  /** Priority names in the current language. */
  priorityLabel(priority: Priority): string {
    return this.t().priority[priority];
  }

  dueFilterLabel(value: DueFilter): string {
    return this.t().filters.due[value];
  }

  /** "3 of 8 done" / "Сделано 3 из 8". */
  readonly progressLabel = computed(() =>
    fill(this.t().board.progress, {
      done: this.doneCards(),
      total: this.totalCards(),
    }),
  );

  readonly shownLabel = computed(() =>
    fill(this.t().board.shown, { count: this.visibleCards() }),
  );

  markDoneLabel(card: Card): string {
    return fill(this.t().card.markAsDone, { title: card.title });
  }

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

  /**
   * Drag & drop is switched off while a filter is on. The indexes the CDK
   * reports refer to what is on screen, and with cards hidden those no longer
   * match the real positions — a drop would land somewhere unintended.
   */
  readonly dragEnabled = computed(() => !this.filtersActive());

  /** Ids of the card lists, so each column accepts cards from the others. */
  readonly cardListIds = computed(() =>
    this.columns().map((column) => `cards-${column.id}`),
  );

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
        this.error.set(readHttpError(err, this.settings.language()));
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
      error: (err: HttpErrorResponse) => this.error.set(readHttpError(err, this.settings.language())),
    });
  }

  async removeColumn(column: BoardColumn): Promise<void> {
    const text = this.t().board;
    const ok = await this.confirm.ask({
      title: fill(text.columnDeleteTitle, { name: column.name }),
      message: column.cards.length
        ? fill(text.columnDeleteWithCards, { count: column.cards.length })
        : text.columnDeleteEmpty,
      confirmLabel: text.deleteColumn,
      cancelLabel: this.t().common.cancel,
    });
    if (!ok) {
      return;
    }

    this.api.removeColumn(column.id).subscribe({
      next: () =>
        this.patchBoard((board) => ({
          ...board,
          columns: (board.columns ?? []).filter((c) => c.id !== column.id),
        })),
      error: (err: HttpErrorResponse) => this.error.set(readHttpError(err, this.settings.language())),
    });
  }

  // ---------- drag & drop ----------

  /**
   * A card was dropped, either inside its own column or into another one.
   *
   * The board is updated on screen first and the request goes out after —
   * waiting for the server would make the card snap back under the cursor.
   * If the request fails, the snapshot taken beforehand is put back.
   */
  dropCard(event: CdkDragDrop<BoardColumn>): void {
    const from = event.previousContainer.data;
    const to = event.container.data;
    const sameColumn = from.id === to.id;

    if (sameColumn && event.previousIndex === event.currentIndex) {
      return;
    }

    const snapshot = this.columns();
    const fromCards = [...from.cards];
    const card = fromCards[event.previousIndex];
    if (!card) {
      return;
    }

    if (sameColumn) {
      moveItemInArray(fromCards, event.previousIndex, event.currentIndex);
      this.setColumnCards(from.id, fromCards);
    } else {
      const toCards = [...to.cards];
      transferArrayItem(
        fromCards,
        toCards,
        event.previousIndex,
        event.currentIndex,
      );
      this.setColumnCards(from.id, fromCards);
      this.setColumnCards(
        to.id,
        // The card now belongs to the other column.
        toCards.map((c) => (c.id === card.id ? { ...c, columnId: to.id } : c)),
      );
    }

    this.api
      .moveCard(card.id, {
        columnId: sameColumn ? undefined : to.id,
        position: event.currentIndex,
      })
      .subscribe({
        next: () => this.error.set(null),
        error: (err: HttpErrorResponse) => {
          this.setColumns(snapshot);
          this.error.set(readHttpError(err, this.settings.language()));
        },
      });
  }

  /** A column was dragged to a new place in the row. */
  dropColumn(event: CdkDragDrop<BoardColumn[]>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    const snapshot = this.columns();
    const reordered = [...snapshot];
    moveItemInArray(reordered, event.previousIndex, event.currentIndex);
    this.setColumns(reordered);

    this.api
      .reorderColumns(
        this.id,
        reordered.map((column) => column.id),
      )
      .subscribe({
        next: () => this.error.set(null),
        error: (err: HttpErrorResponse) => {
          this.setColumns(snapshot);
          this.error.set(readHttpError(err, this.settings.language()));
        },
      });
  }

  dismissError(): void {
    this.error.set(null);
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
      error: (err: HttpErrorResponse) => this.error.set(readHttpError(err, this.settings.language())),
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
        this.error.set(readHttpError(err, this.settings.language()));
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
          this.error.set(readHttpError(err, this.settings.language()));
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
        this.error.set(readHttpError(err, this.settings.language()));
      },
    });
  }

  async removeCard(card: Card): Promise<void> {
    const text = this.t().card;
    const ok = await this.confirm.ask({
      title: fill(text.deleteTitle, { title: card.title }),
      message: text.deleteMessage,
      confirmLabel: text.deleteConfirm,
      cancelLabel: this.t().common.cancel,
    });
    if (!ok) {
      return;
    }

    this.api.removeCard(card.id).subscribe({
      next: () =>
        this.updateColumn(card.columnId, (column) => ({
          ...column,
          cards: column.cards.filter((c) => c.id !== card.id),
        })),
      error: (err: HttpErrorResponse) => this.error.set(readHttpError(err, this.settings.language())),
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
      error: (err: HttpErrorResponse) => this.error.set(readHttpError(err, this.settings.language())),
    });
  }

  removeNote(note: Note): void {
    this.api.removeNote(note.id).subscribe({
      next: () => {
        this.notes.update((list) => list.filter((n) => n.id !== note.id));
        this.bumpNoteCount(note.cardId, -1);
      },
      error: (err: HttpErrorResponse) => this.error.set(readHttpError(err, this.settings.language())),
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
      error: (err: HttpErrorResponse) => this.error.set(readHttpError(err, this.settings.language())),
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
      error: (err: HttpErrorResponse) => this.error.set(readHttpError(err, this.settings.language())),
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
      error: (err: HttpErrorResponse) => this.error.set(readHttpError(err, this.settings.language())),
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

    const text = this.t().due;
    const diff = this.daysUntil(card.dueDate);
    if (diff === 0) return text.today;
    if (diff === 1) return text.tomorrow;
    if (diff === -1) return text.oneDayLate;
    if (diff < -1) return fill(text.daysLate, { count: Math.abs(diff) });

    return new Date(card.dueDate).toLocaleDateString(this.settings.dateLocale(), {
      day: 'numeric',
      month: 'short',
    });
  }

  noteDate(note: Note): string {
    return new Date(note.createdAt).toLocaleDateString(
      this.settings.dateLocale(),
      {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      },
    );
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

  private setColumnCards(columnId: string, cards: Card[]): void {
    this.updateColumn(columnId, (column) => ({ ...column, cards }));
  }

  /** Replaces the whole column list — used by drag & drop and its rollback. */
  private setColumns(columns: BoardColumn[]): void {
    this.patchBoard((board) => ({ ...board, columns }));
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
