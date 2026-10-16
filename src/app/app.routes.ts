
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
    path: 'register',
    loadComponent: () =>
      import('./public/register/register')
        .then(m => m.Register)
  },

  // Routes administrateur
  {
    path: 'admin',
    loadComponent: () =>
      import('./layout/admin-main/admin-main')
        .then(m => m.AdminMain),

    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/admin/dashboard-admin/dashboard-admin')
            .then(m => m.DashboardAdmin)
      },
      {
        path: 'projets',
        loadComponent: () =>
          import('./pages/admin/projets-admin/projets-admin')
            .then(m => m.ProjetsAdmin)
      },
      {
        path: 'dons',
        loadComponent: () =>
          import('./pages/admin/dons-admin/dons-admin')
            .then(m => m.DonsAdmin)
      },
      {
        path: 'rapports',
        loadComponent: () =>
          import('./pages/admin/rapports-admin/rapports-admin')
            .then(m => m.RapportsAdmin)
      },
      {
        path: 'membres',
        loadComponent: () =>
          import('./pages/admin/membres-admin/membres-admin')
            .then(m => m.MembresAdmin)
      },
      {
        path: 'partenaires',
        loadComponent: () =>
          import('./pages/admin/partenaires-admin/partenaires-admin')
            .then(m => m.PartenairesAdmin)
      }
    ]
  },

  // Routes de l'organisation partenaire
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

      // Tableau de bord
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/organisations/dashboard/dashboard')
            .then(m => m.Dashboard)
      },

      // Mon organisation
      {
        path: 'mon-organisation',
        loadComponent: () =>
          import('./pages/organisations/mon-organisation/mon-organisation')
            .then(m => m.MonOrganisation)
      },

      // Modifier les informations de l'organisation
      {
        path: 'modifier/:id',
        loadComponent: () =>
          import('./pages/organisations/modifier-organisation/modifier-organisation')
            .then(m => m.ModifierOrganisation)
      },

  

      // Demandes d'aide
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
      },

      // Bénéficiaires
      {
        path: 'beneficiaires',
        loadComponent: () =>
          import('./pages/organisations/beneficiaires/liste-beneficiaires/liste-beneficiaires')
            .then(m => m.ListeBeneficiaires)
      },
      {
        path: 'beneficiaires/:id',
        loadComponent: () =>
          import('./pages/organisations/beneficiaires/detail-beneficiaire/detail-beneficiaire')
            .then(m => m.DetailBeneficiaire)
      },
      //don attribue par l'admin
 {
  path: 'dons-attribues',
  children: [
    {
      path: '',
      loadComponent: () =>
        import('./pages/organisations/dons-attribues/dons-attribues')
          .then(m => m.DonsAttribues)
    },
    {
      path: 'detail/:id',
      loadComponent: () =>
        import('./pages/organisations/detail-don-attribue/detail-don-attribue')
          .then(m => m.DetailDonAttribue)
    }
  ]
},
//affection don 
{
  path: 'affectations-dons',
  children: [
    {
      path: '',
      loadComponent: () =>
        import('./pages/organisations/affectations-dons/affectations-dons-list/affectations-dons-list')
          .then(m => m.AffectationsDonsList)
    },
    {
      path: 'add-affection-don',
      loadComponent: () =>
        import('./pages/organisations/affectations-dons/add-affection-don/add-affection-don')
          .then(m => m.AddAffectionDon)
    }
  ]
},

//aides-distribuees
{
  path: 'aides-distribuees',
  loadComponent: () =>
    import('./pages/organisations/aides-distribuees/aides-distribuees')
      .then(m => m.AidesDistribueesComponent)

},

{
  path: 'aides-distribuees/ajouter',
  loadComponent: () =>
    import('./pages/organisations/aides-distribuees/ajout-aide-distribuee/ajout-aide-distribuee')
      .then(m => m.AjoutAideDistribueeComponent)
},

//Dons reçus

{
  // Dons reçus
  path: 'dons-reçus',
  children: [
    {
      path: '',
      loadComponent: () =>
        import('./pages/organisations/liste-dons.component/liste-dons.component')
          .then(m => m.ListeDonsComponent)
    },
    {
      path: 'materiel/:id',
      loadComponent: () =>
        import('./pages/organisations/detail-don/detail-don')
          .then(m => m.DetailDonComponent)
    },
    {
      path: 'financier/:id',
      loadComponent: () =>
        import('./pages/organisations/detail-don/detail-don')
          .then(m => m.DetailDonComponent)
    }
  ]
},

      // Études de terrain
      {
        path: 'etudes-terrain',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./pages/etude-terrain/etudes-liste/etudes-liste')
                .then(m => m.EtudesListe)
          },
          {
            path: 'planifier',
            loadComponent: () =>
              import('./pages/etude-terrain/etudes-planifier/etudes-planifier')
                .then(m => m.EtudesPlanifier)
          },
          {
            path: 'realiser/:id',
            loadComponent: () =>
              import('./pages/etude-terrain/etude-terrain')
                .then(m => m.EtudeTerrainComponent)
          },
          {
            path: 'detail/:id',
            loadComponent: () =>
              import('./pages/etude-terrain/etudes-detail/etudes-detail')
                .then(m => m.EtudesDetail)
          },
          {
            path: 'rapport-besoin/creer',
            loadComponent: () =>
              import('./pages/rapport-besoin/rapport-besoin')
                .then(m => m.RapportBesoinComponent)
          },
          {
            path: 'rapport-besoin/detail',
            loadComponent: () =>
              import('./pages/rapport-besoin-detail/rapport-besoin-detail')
                .then(m => m.RapportBesoinDetailComponent)
          },
          {
            path: 'rapport-technique/creer',
            loadComponent: () =>
              import('./pages/rapport-technique/rapport-technique')
                .then(m => m.RapportTechniqueComponent)
          },
          {
            path: 'rapport-technique/detail',
            loadComponent: () =>
              import('./pages/rapport-technique-detail/rapport-technique-detail')
                .then(m => m.RapportTechniqueDetailComponent)
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
