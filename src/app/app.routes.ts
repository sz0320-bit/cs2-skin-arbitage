import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./landing/landing').then(m => m.Landing)
  },
  {
    path: 'opportunities',
    loadComponent: () => import('./opportunities/opportunities').then(m => m.OpportunitiesComponent)
  },
  {
    path: 'opportunities',
    loadComponent: () => import('./opportunities/opportunities').then(m => m.OpportunitiesComponent)
  }
];
