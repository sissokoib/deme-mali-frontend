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
        children: [
          {
            path: '',
            loadComponent: () => import('./pages/etude-terrain/etudes-liste/etudes-liste').then(m => m.EtudesListe)
          },
          {
            path: 'planifier',
            loadComponent: () => import('./pages/etude-terrain/etudes-planifier/etudes-planifier').then(m => m.EtudesPlanifier)
          },
          {
            path: 'realiser',
            loadComponent: () => import('./pages/etude-terrain/etude-terrain').then(m => m.EtudeTerrainComponent)
          },
          {
            path: 'detail/:id',
            loadComponent: () => import('./pages/etude-terrain/etudes-detail/etudes-detail').then(m => m.EtudesDetail)
          },
          {
            path: 'rapport-besoin/creer',
            loadComponent: () => import('./pages/rapport-besoin/rapport-besoin').then(m => m.RapportBesoinComponent)
          },
          {
            path: 'rapport-besoin/detail',
            loadComponent: () => import('./pages/rapport-besoin-detail/rapport-besoin-detail').then(m => m.RapportBesoinDetailComponent)
          },
          {
            path: 'rapport-technique/creer',
            loadComponent: () => import('./pages/rapport-technique/rapport-technique').then(m => m.RapportTechniqueComponent)
          },
          {
            path: 'rapport-technique/detail',
            loadComponent: () => import('./pages/rapport-technique-detail/rapport-technique-detail').then(m => m.RapportTechniqueDetailComponent)
          }
        ]
      },

    ]
  },

  {
    path: '**',
    redirectTo: 'login'
  }

];