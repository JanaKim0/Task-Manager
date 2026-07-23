import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'workspaces',
  },
  {
    // loadComponent — компонент подгружается только когда открыли маршрут
    path: 'workspaces',
    title: 'Рабочие пространства',
    loadComponent: () =>
      import('./pages/workspace-list/workspace-list').then(
        (m) => m.WorkspaceListComponent,
      ),
  },
  {
    path: 'workspaces/:id',
    title: 'Пространство',
    loadComponent: () =>
      import('./pages/workspace-detail/workspace-detail').then(
        (m) => m.WorkspaceDetailComponent,
      ),
  },
  {
    path: '**',
    redirectTo: 'workspaces',
  },
];
