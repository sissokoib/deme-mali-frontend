
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  catchError,
  finalize,
  of,
  switchMap,
  throwError
} from 'rxjs';

import { MatIconModule } from '@angular/material/icon';

import { EtudeTerrainService } from '../../../services/etude-terrain.service';
import { demandeAideService } from '../../../services/demande-aide';
import { RapportBesoinService } from '../../../services/rapport-bessoin';
import { RapportTechniqueService } from '../../../services/rapport-technique';
import { NotificationService } from '../../../services/notification';

import { EtudeTerrain } from '../../../models/etude-terrain.model';
import { Demande } from '../../../models/demande.model';
import { RapportBesoin } from '../../../models/rapport-besoin.model';
import { RapportTechnique } from '../../../models/rapport-technique.model';

@Component({
  selector: 'app-etudes-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule
  ],
  templateUrl: './etudes-detail.html',
  styleUrl: './etudes-detail.css'
})
export class EtudesDetail implements OnInit {

  etude: EtudeTerrain | null = null;
  demande: Demande | null = null;

  rapportBesoin: RapportBesoin | null = null;
  rapportTechnique: RapportTechnique | null = null;

  etudeId = 0;
  chargement = true;
  erreur = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private etudeService: EtudeTerrainService,
    private demandeService: demandeAideService,
    private rapportBesoinService: RapportBesoinService,
    private rapportTechniqueService: RapportTechniqueService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isInteger(id) || id <= 0) {
      this.erreur = 'Identifiant de l’étude invalide.';
      this.chargement = false;
      return;
    }

    this.etudeId = id;
    this.chargerDetail();
  }

  // Charger l'étude, la demande et les rapports associés
  chargerDetail(): void {
    this.chargement = true;
    this.erreur = '';

    this.etude = null;
    this.demande = null;
    this.rapportBesoin = null;
    this.rapportTechnique = null;

    this.etudeService.getEtudeById(this.etudeId).pipe(

      // 1. Charger l'étude puis la demande associée
      switchMap(etude => {
        this.etude = etude;

        return this.demandeService.getDemandeById(
          etude.demandeAideId
        );
      }),

      // 2. Chercher le rapport de besoin
      switchMap(demande => {
        this.demande = demande;

        return this.rapportBesoinService
          .getByEtudeTerrain(this.etudeId)
          .pipe(
            catchError(err => {
              if (err.status === 404) {
                return of(null);
              }

              return throwError(() => err);
            })
          );
      }),

      // 3. Chercher le rapport technique
      switchMap(rapportBesoin => {
        this.rapportBesoin = rapportBesoin;

        if (!rapportBesoin) {
          this.rapportTechnique = null;
          return of(null);
        }

        return this.rapportTechniqueService
          .getByRapportBesoin(rapportBesoin.id)
          .pipe(
            catchError(err => {

              // Aucun rapport technique ou erreur serveur
              if (err.status === 404 || err.status === 500) {
                this.rapportTechnique = null;
                return of(null);
              }

              return throwError(() => err);
            })
          );
      }),

      // 4. Terminer le chargement
      finalize(() => {
        this.chargement = false;
        this.cdr.detectChanges();
      })

    ).subscribe({
      next: rapportTechnique => {
        this.rapportTechnique = rapportTechnique;
        this.cdr.detectChanges();
      },

      error: err => {
        this.erreur =
          err.error?.message ||
          'Impossible de charger les informations de l’étude.';

        this.notificationService.erreur(this.erreur);
        this.cdr.detectChanges();
      }
    });
  }

  // Vérifier si l'étude est terminée
  get etudeTerminee(): boolean {
    return this.etude?.status === 'TERMINEE';
  }

  // Compter les rapports disponibles
  get nombreRapports(): number {
    return Number(this.rapportBesoin !== null)
      + Number(this.rapportTechnique !== null);
  }

  // Modifier l'étude
  modifierEtude(): void {
    if (!this.etude) {
      return;
    }

    this.router.navigate([
      '/organisation/etudes-terrain/modifier',
      this.etude.id
    ]);
  }

  // Ajouter un rapport de besoin
  ajouterRapportBesoin(): void {
    if (!this.etudeTerminee || this.rapportBesoin) {
      return;
    }

    this.router.navigate(
      ['/organisation/etudes-terrain/rapport-besoin/creer'],
      {
        queryParams: {
          etudeId: this.etudeId
        }
      }
    );
  }

  // Ajouter un rapport technique
 
ajouterRapportTechnique(): void {
  if (
    !this.etudeTerminee ||
    !this.rapportBesoin ||
    this.rapportTechnique
  ) {
    return;
  }

  this.router.navigate(
    ['/organisation/etudes-terrain/rapport-technique/creer'],
    {
      queryParams: {
        rapportBesoinId: this.rapportBesoin.id
      }
    }
  );
}


  // Consulter le rapport de besoin
  voirRapportBesoin(): void {
    if (!this.rapportBesoin) {
      return;
    }

    this.router.navigate([
      '/organisation/etudes-terrain/rapport-besoin/detail',
      this.rapportBesoin.id
    ]);
  }



  // Consulter le rapport technique
  voirRapportTechnique(): void {
    if (!this.rapportTechnique) {
      return;
    }

    this.router.navigate([
      '/organisation/etudes-terrain/rapport-technique/detail',
      this.rapportTechnique.id
    ]);
  }

 

  // Retour à la liste des études
  retour(): void {
    this.router.navigate([
      '/organisation/etudes-terrain'
    ]);
  }

  // Modifier le rapport de besoin
modifierRapportBesoin(): void {
  if (!this.rapportBesoin || this.demande?.statut === 'VALIDEE') {
    return;
  }

  this.router.navigate([
    '/organisation/etudes-terrain/rapport-besoin/modifier',
    this.rapportBesoin.id
  ]);
}

// Modifier le rapport technique
modifierRapportTechnique(): void {
  if (!this.rapportTechnique || this.demande?.statut === 'VALIDEE') {
    return;
  }

  this.router.navigate([
    '/organisation/etudes-terrain/rapport-technique/modifier',
    this.rapportTechnique.id
  ]);
}
}
