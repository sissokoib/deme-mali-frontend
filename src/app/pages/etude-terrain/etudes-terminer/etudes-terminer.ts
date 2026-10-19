
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { EtudeTerrainService } from '../../../services/etude-terrain.service';
import { EtudeTerrain } from '../../../models/etude-terrain.model';

@Component({
  selector: 'app-etudes-terminer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './etudes-terminer.html',
  styleUrl: './etudes-terminer.css'
})
export class EtudesTerminer implements OnInit {
  readonly dateDuJour = this.formaterDate(new Date());

  etude: EtudeTerrain | null = null;
  etudeId = 0;

  // La date du système est utilisée par défaut.
  dateRealisation = this.dateDuJour;
  observation = '';
  resultat = '';

  chargement = true;
  enregistrement = false;
  soumis = false;
  erreurChargement = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private etudeService: EtudeTerrainService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isInteger(id) || id <= 0) {
      this.erreurChargement = 'Identifiant de l’étude invalide.';
      this.chargement = false;
      return;
    }

    this.etudeId = id;

    this.etudeService.getEtudeById(id).subscribe({
      next: etude => {
        this.etude = etude;

        if (etude.status !== 'PLANIFIEE') {
          this.erreurChargement =
            'Seule une étude planifiée peut être terminée.';
        }

        this.chargement = false;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Erreur de chargement de l’étude :', err);

        this.erreurChargement =
          'Impossible de charger cette étude.';
        this.chargement = false;
        this.cdr.detectChanges();
      }
    });
  }

  terminer(): void {
    this.soumis = true;

    if (!this.etude || this.etude.status !== 'PLANIFIEE') {
      return;
    }

    if (
      !this.dateRealisation ||
      !this.observation.trim() ||
      !this.resultat.trim()
    ) {
      return;
    }

    if (this.dateRealisation > this.dateDuJour) {
      return;
    }

    const dto = {
      dateRealisation: this.dateRealisation,
      observation: this.observation.trim(),
      resultat: this.resultat.trim()
    };

    this.enregistrement = true;

    this.etudeService.terminerEtude(this.etudeId, dto).subscribe({
      next: () => {
        this.enregistrement = false;

        this.snackBar.open(
          'Étude de terrain terminée avec succès.',
          'Fermer',
          {
            duration: 4000,
            panelClass: ['notification-succes'],
            horizontalPosition: 'end',
            verticalPosition: 'top'
          }
        );

        this.cdr.detectChanges();

        this.router.navigate([
          '/organisation/etudes-terrain/detail',
          this.etudeId
        ]);
      },
      error: err => {
        console.error('Erreur lors de la terminaison :', err);

        const message =
          err?.error?.message ||
          err?.error?.error ||
          'Impossible de terminer cette étude. Réessayez.';

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
      case 'dateRealisation':
        return (
          !this.dateRealisation ||
          this.dateRealisation > this.dateDuJour
        );

      case 'observation':
        return !this.observation.trim();

      case 'resultat':
        return !this.resultat.trim();

      default:
        return false;
    }
  }

  messageErreur(champ: string): string {
    switch (champ) {
      case 'dateRealisation':
        return !this.dateRealisation
          ? 'Veuillez renseigner la date réelle de la visite.'
          : 'La date de réalisation ne peut pas être dans le futur.';

      case 'observation':
        return 'Veuillez renseigner les observations de terrain.';

      case 'resultat':
        return 'Veuillez renseigner le résultat de l’étude.';

      default:
        return '';
    }
  }

  annuler(): void {
    this.router.navigate(['/organisation/etudes-terrain']);
  }

  private formaterDate(date: Date): string {
    const annee = date.getFullYear();
    const mois = String(date.getMonth() + 1).padStart(2, '0');
    const jour = String(date.getDate()).padStart(2, '0');

    return `${annee}-${mois}-${jour}`;
  }
}
