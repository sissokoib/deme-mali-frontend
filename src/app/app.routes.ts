import { Routes } from '@angular/router';

import { Main } from './layout/main/main';
import { Login } from './public/login/login';

import { AuthGuard, GuestGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';

export const routes: Routes = [

  // ============================================================
  // ROUTE PAR DÉFAUT
  // ============================================================

  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  // ============================================================
  // CONNEXION
  // ============================================================

  {
    path: 'login',
    component: Login,
    canActivate: [GuestGuard]
  },

  // ============================================================
  // ESPACE ORGANISATION PARTENAIRE
  // ============================================================

  {
    path: 'organisation',
    component: Main,
    canActivate: [AuthGuard, RoleGuard],
    data: {
      role: 'ORGANISATION_PARTENAIRE'
    },

    children: [

      // /organisation
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },

      // /organisation/dashboard
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/organisations/dashboard/dashboard')
            .then(m => m.Dashboard),

        data: {
          title: 'Tableau de bord'
        }
      }

    ]
  },

  // ============================================================
  // ROUTE INCONNUE
  // ============================================================

  {
    path: '**',
    redirectTo: 'login'
  }

];