
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { MatIconModule } from '@angular/material/icon';

import { NotificationService } from '../../services/notification';
import { RapportBesoin } from '../../models/rapport-besoin.model';
import { demandeAideService } from '../../services/demande-aide';
import { RapportBesoinService } from '../../services/rapport-bessoin';
import { EtudeTerrainService } from '../../services/etude-terrain.service';
import { EtudeTerrain } from '../../models/etude-terrain.model';
import { Demande } from '../../models/demande.model';

@Component({
  selector: 'app-ajouter-rapport-besoin',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './rapport-besoin.html',
  styleUrl: './rapport-besoin.css'
})
export class AjouterRapportBesoin implements OnInit {

  etude: EtudeTerrain | null = null;
  demande: Demande | null = null;

  etudeId = 0;
  chargement = true;
  enregistrement = false;
  erreurChargement = '';

  formulaire = {
    titre: '',
    besoinIdentifie: '',
    descriptionSituation: '',
    solutionProposee: '',
    montantEstime: null as number | null
  };

  erreurs: { [champ: string]: string } = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private etudeService: EtudeTerrainService,
    private demandeService: demandeAideService,
    private rapportBesoinService: RapportBesoinService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = Number(
      this.route.snapshot.queryParamMap.get('etudeId')
    );

    if (!Number.isInteger(id) || id <= 0) {
      this.chargement = false;
      this.erreurChargement = 'Identifiant de l’étude invalide.';
      this.notificationService.erreur(this.erreurChargement);
      this.cdr.detectChanges();
      return;
    }

    this.etudeId = id;
    this.chargerEtude();
  }

  chargerEtude(): void {
    this.chargement = true;
    this.erreurChargement = '';

    this.etudeService.getEtudeById(this.etudeId).subscribe({
      next: (etude) => {
        this.etude = etude;

        if (etude.status !== 'TERMINEE') {
          this.erreurChargement =
            'Le rapport de besoin ne peut être créé que pour une étude terminée.';

          this.notificationService.erreur(this.erreurChargement);
          this.chargement = false;
          this.cdr.detectChanges();
          return;
        }

        this.demandeService.getDemandeById(etude.demandeAideId).subscribe({
          next: (demande) => {
            this.demande = demande;
            this.chargement = false;
            this.cdr.detectChanges();
          },

          error: () => {
            this.chargement = false;
            this.erreurChargement =
              'Impossible de charger la demande associée.';

            this.notificationService.erreur(this.erreurChargement);
            this.cdr.detectChanges();
          }
        });
      },

      error: () => {
        this.chargement = false;
        this.erreurChargement =
          'Impossible de charger les informations de l’étude.';

        this.notificationService.erreur(this.erreurChargement);
        this.cdr.detectChanges();
      }
    });
  }

  validerChamp(champ: string): void {
    switch (champ) {
      case 'titre':
        this.erreurs['titre'] =
          this.formulaire.titre.trim().length < 3
            ? 'Le titre doit contenir au moins 3 caractères.'
            : '';
        break;

      case 'besoinIdentifie':
        this.erreurs['besoinIdentifie'] =
          this.formulaire.besoinIdentifie.trim().length < 5
            ? 'Le besoin identifié doit contenir au moins 5 caractères.'
            : '';
        break;

      case 'descriptionSituation':
        this.erreurs['descriptionSituation'] =
          this.formulaire.descriptionSituation.trim().length < 10
            ? 'La description doit contenir au moins 10 caractères.'
            : '';
        break;

      case 'solutionProposee':
        this.erreurs['solutionProposee'] =
          this.formulaire.solutionProposee.trim().length < 5
            ? 'La solution proposée doit contenir au moins 5 caractères.'
            : '';
        break;

      case 'montantEstime':
        this.erreurs['montantEstime'] =
          this.formulaire.montantEstime === null ||
          !Number.isFinite(Number(this.formulaire.montantEstime)) ||
          Number(this.formulaire.montantEstime) <= 0
            ? 'Le montant estimé doit être supérieur à zéro.'
            : '';
        break;
    }
  }

  validerFormulaire(): boolean {
    this.validerChamp('titre');
    this.validerChamp('besoinIdentifie');
    this.validerChamp('descriptionSituation');
    this.validerChamp('solutionProposee');
    this.validerChamp('montantEstime');

    return Object.values(this.erreurs).every(
      message => !message
    );
  }

  enregistrer(): void {
    if (this.enregistrement) {
      return;
    }

    if (!this.validerFormulaire()) {
      this.notificationService.info(
        'Veuillez corriger les champs indiqués avant de continuer.'
      );
      return;
    }

    if (!this.etude || this.etude.status !== 'TERMINEE') {
      this.notificationService.erreur(
        'Seule une étude terminée peut recevoir un rapport de besoin.'
      );
      return;
    }

    const rapport: Partial<RapportBesoin> = {
      titre: this.formulaire.titre.trim(),
      besoinIdentifie: this.formulaire.besoinIdentifie.trim(),
      descriptionSituation:
        this.formulaire.descriptionSituation.trim(),
      solutionProposee: this.formulaire.solutionProposee.trim(),
      montantEstime: Number(this.formulaire.montantEstime),
      etudeTerrainId: this.etudeId
    };

    this.enregistrement = true;
    this.cdr.detectChanges();

    this.rapportBesoinService.creer(rapport).pipe(
      finalize(() => {
        this.enregistrement = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.notificationService.succes(
          'Le rapport de besoin a été enregistré avec succès.'
        );

        this.router.navigate([
          '/organisation/etudes-terrain/detail',
          this.etudeId
        ]);
      },

      error: (err) => {
        const message =
          err?.error?.message ||
          err?.error?.detail ||
          'Une erreur est survenue lors de l’enregistrement du rapport de besoin.';

        this.notificationService.erreur(message);
      }
    });
  }

  annuler(): void {
    this.router.navigate([
      '/organisation/etudes-terrain/detail',
      this.etudeId
    ]);
  }
}
