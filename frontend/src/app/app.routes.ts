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
    // A key, not finished text: TranslatedTitleStrategy turns it into a
    // tab name in the language currently selected.
    title: 'workspaces',
    loadComponent: () =>
      import('./pages/workspace-list/workspace-list').then(
        (m) => m.WorkspaceListComponent,
      ),
  },
  {
    path: 'workspaces/:id',
    title: 'workspace',
    loadComponent: () =>
      import('./pages/workspace-detail/workspace-detail').then(
        (m) => m.WorkspaceDetailComponent,
      ),
  },
  {
    path: 'boards/:id',
    title: 'board',
    loadComponent: () =>
      import('./pages/board/board').then((m) => m.BoardComponent),
  },
  {
    path: '**',
    redirectTo: 'workspaces',
  },
];
