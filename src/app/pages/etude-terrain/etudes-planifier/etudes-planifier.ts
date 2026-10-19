
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService } from '../../../services/auth.service';
import { demandeAideService } from '../../../services/demande-aide';
import { EtudeTerrainService } from '../../../services/etude-terrain.service';
import { Demande } from '../../../models/demande.model';

@Component({
  selector: 'app-etudes-planifier',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './etudes-planifier.html',
  styleUrl: './etudes-planifier.css'
})
export class EtudesPlanifier implements OnInit {
  readonly dateDuJour = this.formaterDate(new Date());

  demande: Demande | null = null;
  demandeId = 0;
  organisationId: number | null = null;

  datePlanification = '';
  heure = '';
  lieu = '';
  objectif = '';

  chargement = true;
  enregistrement = false;
  soumis = false;
  erreurChargement = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private demandeService: demandeAideService,
    private etudeService: EtudeTerrainService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const utilisateur = this.authService.getCurrentUser();
    const id = Number(
      this.route.snapshot.queryParamMap.get('demandeId')
    );

    if (
      !utilisateur ||
      utilisateur.role !== 'ORGANISATIONPARTENAIRE'
    ) {
      this.erreurChargement =
        'Organisation connectée introuvable.';
      this.chargement = false;
      return;
    }

    if (!Number.isInteger(id) || id <= 0) {
      this.erreurChargement = 'Identifiant de demande invalide.';
      this.chargement = false;
      return;
    }

    this.organisationId = utilisateur.id;
    this.demandeId = id;

    this.demandeService.getDemandeById(id).subscribe({
      next: demande => {
        if (
          demande.organisationPartenaireId !== this.organisationId
        ) {
          this.erreurChargement =
            'Cette demande ne dépend pas de votre organisation.';
        } else {
          this.demande = demande;
        }

        this.chargement = false;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error(
          'Erreur de chargement de la demande :',
          err
        );

        this.erreurChargement =
          'Impossible de charger la demande concernée.';
        this.chargement = false;
        this.cdr.detectChanges();
      }
    });
  }

  enregistrer(): void {
    this.soumis = true;

    if (!this.demande || this.organisationId === null) {
      return;
    }

    if (
      !this.datePlanification ||
      !this.heure ||
      !this.lieu.trim() ||
      !this.objectif.trim()
    ) {
      return;
    }

    if (this.datePlanification < this.dateDuJour) {
      return;
    }

    const dto = {
      demandeAideId: this.demandeId,
      organisationPartenaireId: this.organisationId,
      datePlanification: this.datePlanification,
      heure: `${this.datePlanification}T${this.heure}:00`,
      lieu: this.lieu.trim(),
      objectif: this.objectif.trim()
    };

    this.enregistrement = true;

    this.etudeService.creerEtude(dto).subscribe({
      next: () => {
        this.enregistrement = false;

        this.snackBar.open(
          'Étude de terrain planifiée avec succès.',
          'Fermer',
          {
            duration: 4000,
            panelClass: ['notification-succes'],
            horizontalPosition: 'end',
            verticalPosition: 'top'
          }
        );

        this.cdr.detectChanges();
        this.router.navigate(['/organisation/etudes-terrain']);
      },
      error: err => {
        console.error('Erreur de planification :', err);

        const message =
          err?.error?.message ||
          err?.error?.error ||
          'Impossible de planifier cette étude. Réessayez.';

        this.snackBar.open(message, 'Fermer', {
          duration: 5000,
          panelClass: ['notification-erreur'],
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });

        this.enregistrement = false;
        this.cdr.detectChanges();
      }
    });
  }

  champInvalide(champ: string): boolean {
    if (!this.soumis) return false;

    switch (champ) {
      case 'datePlanification':
        return (
          !this.datePlanification ||
          this.datePlanification < this.dateDuJour
        );

      case 'heure':
        return !this.heure;

      case 'lieu':
        return !this.lieu.trim();

      case 'objectif':
        return !this.objectif.trim();

      default:
        return false;
    }
  }

  messageErreur(champ: string): string {
    switch (champ) {
      case 'datePlanification':
        return !this.datePlanification
          ? 'Veuillez renseigner la date prévue.'
          : 'La date de visite ne peut pas être dans le passé.';

      case 'heure':
        return 'Veuillez renseigner l’heure prévue.';

      case 'lieu':
        return 'Veuillez renseigner le lieu de la visite.';

      case 'objectif':
        return 'Veuillez renseigner l’objectif de la visite.';

      default:
        return '';
    }
  }

  annuler(): void {
    this.router.navigate(['/organisation/etudes-terrain']);
  }

  consulterDemandes(): void {
    this.router.navigate(['/organisation/demandes-aide']);
  }

  private formaterDate(date: Date): string {
    const annee = date.getFullYear();
    const mois = String(date.getMonth() + 1).padStart(2, '0');
    const jour = String(date.getDate()).padStart(2, '0');

    return `${annee}-${mois}-${jour}`;
  }
}
