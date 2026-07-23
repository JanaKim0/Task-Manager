import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'workspaces',
  },
  {
    // loadComponent: the code for this screen is downloaded only when the
    // user actually opens the route.
    path: 'workspaces',
    title: 'Workspaces — Task Manager',
    loadComponent: () =>
      import('./pages/workspace-list/workspace-list').then(
        (m) => m.WorkspaceListComponent,
      ),
  },
  {
    path: 'workspaces/:id',
    title: 'Workspace — Task Manager',
    loadComponent: () =>
      import('./pages/workspace-detail/workspace-detail').then(
        (m) => m.WorkspaceDetailComponent,
      ),
  },
  {
    path: 'boards/:id',
    title: 'Board — Task Manager',
    loadComponent: () =>
      import('./pages/board/board').then((m) => m.BoardComponent),
  },
  {
    path: '**',
    redirectTo: 'workspaces',
  },
];
