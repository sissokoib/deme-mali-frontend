import { Routes } from '@angular/router';

import { Main } from './layout/main/main';
import { Login } from './public/login/login';

import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';

export const routes: Routes = [

  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  {
    path: 'login',
    component: Login
  },

  {
    path: 'organisation',
    component: Main,
    canActivate: [AuthGuard, RoleGuard],
    data: {
      role: 'ORGANISATIONPARTENAIRE'
    },
    children: [

      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },

      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/organisations/dashboard/dashboard')
            .then(m => m.Dashboard)
      },

      {
        path: 'etudes-terrain',
        loadComponent: () =>
          import('./pages/etude-terrain/etude-terrain')
            .then(m => m.EtudeTerrainComponent)
      },

      {
        path: 'rapports-besoin',
        loadComponent: () =>
          import('./pages/rapport-besoin/rapport-besoin')
            .then(m => m.RapportBesoinComponent)
      },

      {
        path: 'rapports-technique',
        loadComponent: () =>
          import('./pages/rapport-technique/rapport-technique')
            .then(m => m.RapportTechniqueComponent)
      }

    ]
  },

  {
    path: '**',
    redirectTo: 'login'
  }

];