
import { Routes } from '@angular/router';

import { Main } from './layout/main/main';
import { Login } from './public/login/login';

import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';

export const routes: Routes = [
  // ROUTE PAR DÉFAUT
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  // CONNEXION
  {
    path: 'login',
    component: Login
  },

  // INSCRIPTION
  {
    path: 'register',
    loadComponent: () =>
      import('./public/register/register')
        .then(m => m.Register)
  },

  // ROUTES ADMINISTRATEUR
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

  // ROUTES DE L'ORGANISATION PARTENAIRE
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

      // TABLEAU DE BORD
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/organisations/dashboard/dashboard')
            .then(m => m.Dashboard)
      },

      // MON ORGANISATION
      {
        path: 'mon-organisation',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./pages/organisations/mon-organisation/mon-organisation')
                .then(m => m.MonOrganisation)
          },
          {
            path: 'modifier/:id',
            loadComponent: () =>
              import('./pages/organisations/modifier-organisation/modifier-organisation')
                .then(m => m.ModifierOrganisation)
          }
        ]
      },

      // DEMANDES D'AIDE
      {
        path: 'demandes-aide',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./pages/organisations/demandes/list-demandes/list-demandes')
                .then(m => m.ListDemandes)
          },
          {
            path: 'add-demandes-aide',
            loadComponent: () =>
              import('./pages/organisations/demandes/add-demandes/add-demandes')
                .then(m => m.AddDemandesAide)
          },
          {
            path: ':id/modifier',
            loadComponent: () =>
              import('./pages/organisations/demandes/edit-demandes/edit-demandes')
                .then(m => m.ModifierDemandesAide)
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./pages/organisations/demandes/detail-demande/detail-demande')
                .then(m => m.DetailDemande)
          }
        ]
      },

      // BÉNÉFICIAIRES
      {
        path: 'beneficiaires',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./pages/organisations/beneficiaires/liste-beneficiaires/liste-beneficiaires')
                .then(m => m.ListeBeneficiaires)
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./pages/organisations/beneficiaires/detail-beneficiaire/detail-beneficiaire')
                .then(m => m.DetailBeneficiaire)
          }
        ]
      },

      // DONS ATTRIBUÉS
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

      // AFFECTATIONS DE DONS
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

      // AIDES DISTRIBUÉES
      {
        path: 'aide-distribuee',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./pages/organisations/aides-distribuees/aides-distribuees')
                .then(m => m.AidesDistribueesComponent)
          },
          {
            path: 'ajouter',
            loadComponent: () =>
              import('./pages/organisations/aides-distribuees/ajout-aide-distribuee/ajout-aide-distribuee')
                .then(m => m.AjoutAideDistribueeComponent)
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./pages/organisations/aides-distribuees/detail-aide-distribuee/detail-aide-distribuee')
                .then(m => m.DetailAideDistribueeComponent)
          }
        ]
      },

      // DONS REÇUS
      {
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

      // ÉTUDES DE TERRAIN ET RAPPORTS
      {
        path: 'etudes-terrain',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./pages/etude-terrain/etudes-liste/etudes-liste')
                .then(m => m.EtudesTerrainList)
          },
          {
            path: 'planifier',
            loadComponent: () =>
              import('./pages/etude-terrain/etudes-planifier/etudes-planifier')
                .then(m => m.EtudesPlanifier)
          },
          {
            path: 'terminer/:id',
            loadComponent: () =>
              import('./pages/etude-terrain/etudes-terminer/etudes-terminer')
                .then(m => m.EtudesTerminer)
          },
          {
            path: 'detail/:id',
            loadComponent: () =>
              import('./pages/etude-terrain/etudes-detail/etudes-detail')
                .then(m => m.EtudesDetail)
          },
          {
            path: 'modifier/:id',
            loadComponent: () =>
              import('./pages/etude-terrain/modifier-etude-terrain/modifier-etude-terrain')
                .then(m => m.ModifierEtudeTerrain)
          },

          // RAPPORTS DE BESOIN
          {
            path: 'rapport-besoin/creer',
            loadComponent: () =>
              import('./pages/rapport-besoin/rapport-besoin')
                .then(m => m.AjouterRapportBesoin)
          },
          {
            path: 'rapport-besoin/modifier/:id',
            loadComponent: () =>
              import('./pages/rapport-besoin/modifier-rapport-besoin/modifier-rapport-besoin')
                .then(m => m.RapportBesoinModifier)
          },
          {
            path: 'rapport-besoin/detail/:id',
            loadComponent: () =>
              import('./pages/rapport-besoin/rapport-besoin-detail/rapport-besoin-detail')
                .then(m => m.DetailRapportBesoin)
          },

          // RAPPORTS TECHNIQUES
          {
            path: 'rapport-technique/creer',
            loadComponent: () =>
              import('./pages/rapport-technique/ajouter-rapport-technique/ajouter-rapport-technique')
                .then(m => m.AjouterRapportTechnique)
          },
          {
            path: 'rapport-technique/modifier/:id',
            loadComponent: () =>
              import('./pages/rapport-technique/modifier-rapport-technique/modifier-rapport-technique')
                .then(m => m.ModifierRapportTechnique)
          },
          {
            path: 'rapport-technique/detail/:id',
            loadComponent: () =>
              import('./pages/rapport-technique/detail-rapport-technique/detail-rapport-technique')
                .then(m => m.DetailRapportTechniqueComponent)
          }
        ]
      }
    ]
  },

  // ROUTE INCONNUE
  {
    path: '**',
    redirectTo: 'login'
  }
];
