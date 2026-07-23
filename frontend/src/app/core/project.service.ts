import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CreateProjectDto, Project, UpdateProjectDto } from './models';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/projects`;

  list(workspaceId?: string): Observable<Project[]> {
    const params = workspaceId
      ? new HttpParams().set('workspaceId', workspaceId)
      : undefined;
    return this.http.get<Project[]>(this.baseUrl, { params });
  }

  get(id: string): Observable<Project> {
    return this.http.get<Project>(`${this.baseUrl}/${id}`);
  }

  create(dto: CreateProjectDto): Observable<Project> {
    return this.http.post<Project>(this.baseUrl, dto);
  }

  update(id: string, dto: UpdateProjectDto): Observable<Project> {
    return this.http.patch<Project>(`${this.baseUrl}/${id}`, dto);
  }

  remove(id: string): Observable<Project> {
    return this.http.delete<Project>(`${this.baseUrl}/${id}`);
  }
}
