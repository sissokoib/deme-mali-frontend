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
    path: 'admin',
    loadComponent: () => import('./layout/admin-main/admin-main').then(m => m.AdminMain),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/admin/dashboard-admin/dashboard-admin').then(m => m.DashboardAdmin)
      },
      {
        path: 'projets',
        loadComponent: () => import('./pages/admin/projets-admin/projets-admin').then(m => m.ProjetsAdmin)
      },
      {
        path: 'dons',
        loadComponent: () => import('./pages/admin/dons-admin/dons-admin').then(m => m.DonsAdmin)
      },
      {
        path: 'rapports',
        loadComponent: () => import('./pages/admin/rapports-admin/rapports-admin').then(m => m.RapportsAdmin)
      },
      {
        path: 'membres',
        loadComponent: () => import('./pages/admin/membres-admin/membres-admin').then(m => m.MembresAdmin)
      },
      {
        path: 'partenaires',
        loadComponent: () => import('./pages/admin/partenaires-admin/partenaires-admin').then(m => m.PartenairesAdmin)
      }
      // other admin routes like projets, dons, etc. will go here later
    ]
  },

  {
    path: 'register',
    loadComponent: () => import('./public/register/register').then(m => m.Register)
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
            path: 'realiser/:id',
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
          {
        path: 'demandes-aide',
        loadComponent: () =>
          import('./pages/organisations/demandes/list-demandes/list-demandes')
            .then(m => m.ListDemandes)
      },
         {
        path: 'add-demandes-aide',
        loadComponent: () =>
          import('./pages/organisations/demandes/add-demndes/add-demndes')
            .then(m => m.AddDemndes)
      },


    ]
  },
  
  

  {
    path: '**',
    redirectTo: 'login'
  }

];