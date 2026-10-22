import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';

import { RapportTechniqueService } from '../../../services/rapport-technique';
import { NotificationService } from '../../../services/notification';

import {
  RapportTechnique,
  DetailRapportTechnique
} from '../../../models/rapport-technique.model';

@Component({
  selector: 'app-detail-rapport-technique',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule
  ],
  templateUrl: './detail-rapport-technique.html',
  styleUrl: './detail-rapport-technique.css'
})
export class DetailRapportTechniqueComponent implements OnInit {

  rapport: RapportTechnique | null = null;

  rapportId = 0;
  demandeStatut = '';

  chargement = true;
  erreur = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private rapportTechniqueService: RapportTechniqueService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isInteger(id) || id <= 0) {
      this.erreur = 'Identifiant du rapport technique invalide.';
      this.chargement = false;
      return;
    }

    this.rapportId = id;

    // Le statut peut être transmis par query paramètre.
    this.demandeStatut =
      this.route.snapshot.queryParamMap.get('statut') ?? '';

    this.chargerRapport();
  }

  chargerRapport(): void {
    this.chargement = true;
    this.erreur = '';

    this.rapportTechniqueService.getById(this.rapportId)
      .pipe(
        finalize(() => {
          this.chargement = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (data: RapportTechnique) => {
          this.rapport = {
            ...data,
            details: (data.details ?? []).map(detail => ({
              ...detail,
              quantite: Number(detail.quantite) || 0,
              prixUnitaire: Number(detail.prixUnitaire) || 0,
              montant:
                (Number(detail.quantite) || 0) *
                (Number(detail.prixUnitaire) || 0)
            }))
          };

          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(
            'Erreur lors du chargement du rapport technique :',
            err
          );

          this.erreur =
            'Impossible de charger le rapport technique.';

          this.notificationService.erreur(this.erreur);
        }
      });
  }

 
 
  get demandeValidee(): boolean {
  return (
    this.rapport?.statutDemande?.toUpperCase() === 'VALIDEE' ||
    this.demandeStatut?.toUpperCase() === 'VALIDEE'
  );
}

 
  get nombreRessources(): number {
    return this.rapport?.details?.length ?? 0;
  }


  get montantTotal(): number {
    return (this.rapport?.details ?? []).reduce(
      (total, detail) =>
        total +
        (Number(detail.quantite) || 0) *
        (Number(detail.prixUnitaire) || 0),
      0
    );
  }

  calculerMontant(detail: DetailRapportTechnique): number {
    return (
      (Number(detail.quantite) || 0) *
      (Number(detail.prixUnitaire) || 0)
    );
  }


  retour(): void {
    this.router.navigate(['/organisation/etudes-terrain']);
  }

  /**
   * Navigation vers la page de modification.
   * Aucun accès à la modification si la demande est validée.
   */
  modifierRapport(): void {
    if (this.demandeValidee) {
      this.notificationService.erreur(
        'La modification est impossible : la demande est déjà validée.'
      );
      return;
    }

    if (!this.rapport) {
      return;
    }

    this.router.navigate([
      '/organisation/etudes-terrain/rapport-technique/modifier',
      this.rapport.id
    ]);
  }
}