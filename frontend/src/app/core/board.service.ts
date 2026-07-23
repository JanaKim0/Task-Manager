import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Board,
  BoardColumn,
  Card,
  CreateCardDto,
  CreateColumnDto,
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

  removeCard(id: string): Observable<Card> {
    return this.http.delete<Card>(`${this.api}/cards/${id}`);
  }
}
