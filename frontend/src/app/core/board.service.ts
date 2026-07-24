import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Board,
  BoardColumn,
  Card,
  ChecklistItem,
  CreateCardDto,
  CreateChecklistItemDto,
  CreateColumnDto,
  CreateNoteDto,
  Note,
  UpdateCardDto,
  UpdateColumnDto,
} from './models';

/** Boards, columns and cards — everything the board screen needs. */
@Injectable({ providedIn: 'root' })
export class BoardService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  /** The whole board in one request: columns with their cards inside. */
  getBoard(id: string): Observable<Board> {
    return this.http.get<Board>(`${this.api}/boards/${id}`);
  }

  createColumn(dto: CreateColumnDto): Observable<BoardColumn> {
    return this.http.post<BoardColumn>(`${this.api}/columns`, dto);
  }

  updateColumn(id: string, dto: UpdateColumnDto): Observable<BoardColumn> {
    return this.http.patch<BoardColumn>(`${this.api}/columns/${id}`, dto);
  }

  removeColumn(id: string): Observable<BoardColumn> {
    return this.http.delete<BoardColumn>(`${this.api}/columns/${id}`);
  }

  createCard(dto: CreateCardDto): Observable<Card> {
    return this.http.post<Card>(`${this.api}/cards`, dto);
  }

  updateCard(id: string, dto: UpdateCardDto): Observable<Card> {
    return this.http.patch<Card>(`${this.api}/cards/${id}`, dto);
  }

  /** Flips done / not done. The server decides the new value. */
  toggleCard(id: string): Observable<Card> {
    return this.http.patch<Card>(`${this.api}/cards/${id}/toggle`, {});
  }

  /** Saves where a dragged card landed. */
  moveCard(
    id: string,
    payload: { columnId?: string; position: number },
  ): Observable<Card> {
    return this.http.patch<Card>(`${this.api}/cards/${id}/move`, payload);
  }

  /** Saves the new left-to-right order of the columns. */
  reorderColumns(
    boardId: string,
    orderedIds: string[],
  ): Observable<BoardColumn[]> {
    return this.http.patch<BoardColumn[]>(`${this.api}/columns/reorder`, {
      boardId,
      orderedIds,
    });
  }

  removeCard(id: string): Observable<Card> {
    return this.http.delete<Card>(`${this.api}/cards/${id}`);
  }

  /** One card with its notes and checklist — used by the editor dialog. */
  getCard(id: string): Observable<Card> {
    return this.http.get<Card>(`${this.api}/cards/${id}`);
  }

  // ---------- notes ----------

  createNote(dto: CreateNoteDto): Observable<Note> {
    return this.http.post<Note>(`${this.api}/notes`, dto);
  }

  removeNote(id: string): Observable<Note> {
    return this.http.delete<Note>(`${this.api}/notes/${id}`);
  }

  // ---------- checklist ----------

  createChecklistItem(dto: CreateChecklistItemDto): Observable<ChecklistItem> {
    return this.http.post<ChecklistItem>(`${this.api}/checklist`, dto);
  }

  toggleChecklistItem(id: string): Observable<ChecklistItem> {
    return this.http.patch<ChecklistItem>(
      `${this.api}/checklist/${id}/toggle`,
      {},
    );
  }

  removeChecklistItem(id: string): Observable<ChecklistItem> {
    return this.http.delete<ChecklistItem>(`${this.api}/checklist/${id}`);
  }
}
