import { Component, computed, inject, Input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { BoardService } from '../../core/board.service';
import {
  Board,
  BoardColumn,
  Card,
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

  /** The card open in the editor dialog, or null when it is closed. */
  readonly editingCard = signal<Card | null>(null);

  readonly showColumnForm = signal(false);
  readonly newColumnName = signal('');

  readonly priorities = PRIORITIES;
  readonly priorityLabels = PRIORITY_LABELS;

  readonly columns = computed(() => this.board()?.columns ?? []);

  readonly totalCards = computed(() =>
    this.columns().reduce((sum, column) => sum + column.cards.length, 0),
  );

  readonly doneCards = computed(() =>
    this.columns().reduce(
      (sum, column) => sum + column.cards.filter((c) => c.done).length,
      0,
    ),
  );

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
          cards: [...column.cards, card],
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
  }

  closeEditor(): void {
    this.editingCard.set(null);
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
          this.replaceCard(updated);
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
      next: (updated) => this.replaceCard(updated),
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
    return Math.round((dueMidnight.getTime() - todayMidnight.getTime()) / msPerDay);
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
