import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'opportunities',
    loadComponent: () => import('./opportunities/opportunities').then(m => m.OpportunitiesComponent)
  }
];
