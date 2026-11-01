

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { Router } from '@angular/router';

import { forkJoin, of } from 'rxjs';

import { catchError } from 'rxjs/operators';

import { MatIconModule } from '@angular/material/icon';



import { AuthService } from '../../../services/auth.service';

import { demandeAideService } from '../../../services/demande-aide';

import { EtudeTerrainService } from '../../../services/etude-terrain.service';



import { Demande } from '../../../models/demande.model';

import { EtudeTerrain } from '../../../models/etude-terrain.model';



type ActionEtude = 'PLANIFIER' | 'CONTINUER' | 'VOIR';



interface DemandeEtude {

  demande: Demande;

  etude: EtudeTerrain | null;

  action: ActionEtude;

}



@Component({

  selector: 'app-etudes-terrain-list',

  standalone: true,

  imports: [CommonModule, FormsModule, MatIconModule],

  templateUrl:'./etudes-liste.html',

  styleUrl: './etudes-liste.css'

})

export class EtudesTerrainList implements OnInit {

  demandes: DemandeEtude[] = [];

  demandesFiltrees: DemandeEtude[] = [];



  chargement = true;

  erreur = '';

  recherche = '';

  filtreStatut = 'TOUTES';

  organisationId: number | null = null;



  pageActuelle = 1;

  elementsParPage = 5;



  constructor(

    private authService: AuthService,

    private demandeService: demandeAideService,

    private etudeService: EtudeTerrainService,

    private router: Router,

    private cdr: ChangeDetectorRef

  ) {}



  ngOnInit(): void {
    this.authService.currentUser$.subscribe(utilisateur => {
      const user = utilisateur || this.authService.getCurrentUser();

      if (!user) {
        this.erreur = 'Impossible d’identifier l’organisation connectée.';
        this.chargement = false;
        this.cdr.detectChanges();
        return;
      }

      // Normalisation du rôle pour accepter : 'ORGANISATIONPARTENAIRE', 'ROLE_ORGANISATIONPARTENAIRE', 'ORGANISATION_PARTENAIRE'
      const rawRole = (this.authService.getRole() || (user as any).role || '')
        .toUpperCase()
        .replace('ROLE_', '')
        .replace(/_/g, '')
        .trim();

      const estOrganisation = rawRole === 'ORGANISATIONPARTENAIRE' || rawRole.includes('ORGANISATION');

      if (!estOrganisation) {
        this.erreur = 'Impossible d’identifier l’organisation connectée.';
        this.chargement = false;
        this.cdr.detectChanges();
        return;
      }

      const id =
        (user as any).organisationPartenaireId ??
        (user as any).organisationId ??
        (user as any).organisationPartenaire?.id ??
        (user as any).organisation?.id ??
        user.id;

      this.organisationId = Number(id) || user.id;
      this.chargerDonnees();
    });
  }



  chargerDonnees(): void {

    if (this.organisationId === null) return;



    this.chargement = true;

    this.erreur = '';



    forkJoin({

      demandesOrg: this.demandeService.getDemandesParOrganisation(

        this.organisationId

      ).pipe(catchError(() => of([] as Demande[]))),

      toutesDemandes: this.demandeService.getDemandes().pipe(catchError(() => of([] as Demande[]))),

      etudes: this.etudeService.getEtudesParOrganisation(

        this.organisationId

      ).pipe(catchError(() => of([] as EtudeTerrain[])))

    }).subscribe({

      next: ({ demandesOrg, toutesDemandes, etudes }) => {

        const etudesParDemande = new Map<number, EtudeTerrain>();



        (etudes || []).forEach(etude => {

          etudesParDemande.set(etude.demandeAideId, etude);

        });



        const demandesParId = new Map<number, Demande>();



        // 1. Récupérer toutes les demandes existantes en base pour avoir leur VRAI titre

        (toutesDemandes || []).forEach(demande => {

          demandesParId.set(demande.id, demande);

        });



        // 2. Compléter / écraser avec les demandes spécifiques de l'organisation

        (demandesOrg || []).forEach(demande => {

          demandesParId.set(demande.id, demande);

        });



        // 3. Pour chaque étude en base, s'assurer que sa demande est présente avec son vrai titre

        (etudes || []).forEach(etude => {

          if (!demandesParId.has(etude.demandeAideId)) {

            const titreReel = (etude as any).demandeAide?.titre ||

                              (etude as any).titreDemande ||

                              (etude as any).titreDemandeAide ||

                              etude.objectif ||

                              'Aide solidaire';



            demandesParId.set(etude.demandeAideId, {

              id: etude.demandeAideId,

              titre: titreReel,

              typeDemandeAide: (etude as any).demandeAide?.typeDemandeAide || 'URGENTE',

              statut: (etude as any).demandeAide?.statut || 'VALIDEE',

              dateCreation: etude.dateRealisation || etude.datePlanification || new Date().toISOString()

            } as any);

          }

        });



        this.demandes = Array.from(demandesParId.values()).map(

          (demande: Demande) => {

            const etude = etudesParDemande.get(demande.id) ?? null;



            let action: ActionEtude = 'PLANIFIER';



            if (etude?.status === 'PLANIFIEE') {

              action = 'CONTINUER';

            } else if (etude?.status === 'TERMINEE') {

              action = 'VOIR';

            }



            return { demande, etude, action };

          }

        );



        this.appliquerFiltres();

        this.chargement = false;

        this.cdr.detectChanges();

      },

      error: err => {

        console.error('Erreur de chargement :', err);

        this.erreur = 'Impossible de charger les demandes et les études.';

        this.chargement = false;

        this.cdr.detectChanges();

      }

    });

  }



  appliquerFiltres(): void {

    const terme = this.recherche.trim().toLowerCase();



    this.demandesFiltrees = this.demandes.filter(item => {

      const demande = item.demande;



      const correspondRecherche =

        !terme ||

        demande.titre?.toLowerCase().includes(terme) ||

        `${demande.beneficiairePrenom ?? ''} ${demande.beneficiaireNom ?? ''}`

          .toLowerCase()

          .includes(terme) ||

        String(demande.id).includes(terme);



      const statut = item.etude?.status ?? 'A_FAIRE';



      const correspondStatut =

        this.filtreStatut === 'TOUTES' ||

        (this.filtreStatut === 'A_FAIRE' && statut === 'A_FAIRE') ||

        statut === this.filtreStatut;



      return correspondRecherche && correspondStatut;

    });



    this.demandesFiltrees.sort((a, b) => {

      const dateA = a.demande.dateCreation

        ? new Date(a.demande.dateCreation).getTime()

        : 0;



      const dateB = b.demande.dateCreation

        ? new Date(b.demande.dateCreation).getTime()

        : 0;



      return dateB - dateA;

    });



    this.pageActuelle = 1;

  }



  get nombreAPlanifier(): number {

    return this.demandes.filter(d => d.action === 'PLANIFIER').length;

  }



  get nombrePlanifiees(): number {

    return this.demandes.filter(d => d.action === 'CONTINUER').length;

  }



  get nombreTerminees(): number {

    return this.demandes.filter(d => d.action === 'VOIR').length;

  }



  ouvrirAction(item: DemandeEtude): void {

    switch (item.action) {

      case 'PLANIFIER':

        this.router.navigate(

          ['/organisation/etudes-terrain/planifier'],

          { queryParams: { demandeId: item.demande.id } }

        );

        break;



      case 'CONTINUER':

        if (item.etude) {

          this.router.navigate([

            '/organisation/etudes-terrain/terminer',

            item.etude.id

          ]);

        }

        break;



      case 'VOIR':

        if (item.etude) {

          this.router.navigate([

            '/organisation/etudes-terrain/detail',

            item.etude.id

          ]);

        }

        break;

    }

  }



  get nombrePages(): number {

    return Math.max(

      1,

      Math.ceil(this.demandesFiltrees.length / this.elementsParPage)

    );

  }



  get pages(): number[] {

    return Array.from(

      { length: this.nombrePages },

      (_, index) => index + 1

    );

  }



  get demandesPagees(): DemandeEtude[] {

    const debut = (this.pageActuelle - 1) * this.elementsParPage;



    return this.demandesFiltrees.slice(

      debut,

      debut + this.elementsParPage

    );

  }



  get debutElement(): number {

    return this.demandesFiltrees.length === 0

      ? 0

      : (this.pageActuelle - 1) * this.elementsParPage + 1;

  }



  get finElement(): number {

    return Math.min(

      this.pageActuelle * this.elementsParPage,

      this.demandesFiltrees.length

    );

  }



  changerPage(page: number): void {

    if (page >= 1 && page <= this.nombrePages) {

      this.pageActuelle = page;

    }

  }

}

