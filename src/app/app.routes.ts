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

  {
    path: 'demandes-aide/:id',
    loadComponent: () =>
      import('./pages/organisations/demandes/detail-demande/detail-demande')
        .then(m => m.DetailDemande)
  },

  {
    path: 'demandes-aide/:id/modifier',
    loadComponent: () =>
      import('./pages/organisations/demandes/edit-demandes/edit-demandes')
        .then(m => m.EditDemandes)
  }

]


  },
  
  

  {
    path: '**',
    redirectTo: 'login'
  }

];