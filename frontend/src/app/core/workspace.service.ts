import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CreateWorkspaceDto, UpdateWorkspaceDto, Workspace } from './models';

/**
 * Every call to /api/workspaces lives here, so components never deal with
 * URLs or HttpClient directly.
 */
@Injectable({ providedIn: 'root' })
export class WorkspaceService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/workspaces`;

  list(): Observable<Workspace[]> {
    return this.http.get<Workspace[]>(this.baseUrl);
  }

  get(id: string): Observable<Workspace> {
    return this.http.get<Workspace>(`${this.baseUrl}/${id}`);
  }

  create(dto: CreateWorkspaceDto): Observable<Workspace> {
    return this.http.post<Workspace>(this.baseUrl, dto);
  }

  update(id: string, dto: UpdateWorkspaceDto): Observable<Workspace> {
    return this.http.patch<Workspace>(`${this.baseUrl}/${id}`, dto);
  }

  remove(id: string): Observable<Workspace> {
    return this.http.delete<Workspace>(`${this.baseUrl}/${id}`);
  }
}
