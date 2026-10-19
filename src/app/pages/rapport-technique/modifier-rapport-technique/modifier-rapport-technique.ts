
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  selector: 'app-modifier-rapport-technique',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './modifier-rapport-technique.html',
  styleUrls: ['./modifier-rapport-technique.css']
})
export class ModifierRapportTechnique implements OnInit {

  rapportId = 0;
  rapport: RapportTechnique | null = null;

  descriptionTechnique = '';
  ressources: DetailRapportTechnique[] = [];

  nouvelleRessource: DetailRapportTechnique = this.creerRessourceVide();

  chargement = true;
  enregistrement = false;
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
    this.chargerRapport();
  }

  private creerRessourceVide(): DetailRapportTechnique {
    return {
      designation: '',
      quantite: 1,
      unite: '',
      prixUnitaire: 0,
      montant: 0
    };
  }

  /**
   * Charge les données enregistrées en base.
   * Les identifiants des détails sont conservés.
   */
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
        next: (rapport: RapportTechnique) => {
          this.rapport = rapport;
          this.descriptionTechnique =
            rapport.descriptionTechnique ?? '';

          this.ressources = (rapport.details ?? []).map(detail => {
            const quantite = Number(detail.quantite) || 0;
            const prixUnitaire = Number(detail.prixUnitaire) || 0;

            return {
              ...detail,
              quantite,
              prixUnitaire,
              montant: quantite * prixUnitaire
            };
          });

          this.recalculerMontant();
        },
        error: err => {
          console.error('Erreur de chargement :', err);
          this.erreur =
            'Impossible de charger le rapport technique.';
        }
      });
  }

  calculerMontant(
    ressource: DetailRapportTechnique
  ): number {
    const quantite = Number(ressource.quantite) || 0;
    const prix = Number(ressource.prixUnitaire) || 0;

    return quantite * prix;
  }

  get montantTotal(): number {
    return this.ressources.reduce(
      (total, ressource) =>
        total + this.calculerMontant(ressource),
      0
    );
  }

  /**
   * Actualise les montants affichés après une modification.
   */
  recalculerMontant(): void {
    this.ressources = this.ressources.map(ressource => ({
      ...ressource,
      montant: this.calculerMontant(ressource)
    }));
  }

  /**
   * Ajoute une nouvelle ressource.
   * Une nouvelle ressource n'a pas encore d'identifiant.
   */
  ajouterRessource(): void {
    const designation =
      this.nouvelleRessource.designation?.trim() ?? '';
    const unite =
      this.nouvelleRessource.unite?.trim() ?? '';
    const quantite = Number(this.nouvelleRessource.quantite);
    const prix = Number(this.nouvelleRessource.prixUnitaire);

    if (!designation && !unite) {
      this.notificationService.erreur(
        'Renseigne au moins la désignation et l’unité de la ressource.'
      );
      return;
    }

    if (
      !Number.isFinite(quantite) ||
      !Number.isFinite(prix) ||
      quantite <= 0 ||
      prix < 0
    ) {
      this.notificationService.erreur(
        'La quantité doit être supérieure à zéro et le prix doit être positif ou nul.'
      );
      return;
    }

    this.ressources = [
      ...this.ressources,
      {
        designation,
        quantite,
        unite,
        prixUnitaire: prix,
        montant: quantite * prix
      }
    ];

    this.nouvelleRessource = this.creerRessourceVide();
    this.recalculerMontant();
  }

  /**
   * Retire la ressource de la liste affichée.
   * La suppression en base sera effectuée par le backend
   * lors de l'enregistrement du rapport.
   */
  supprimerRessource(index: number): void {
    if (index < 0 || index >= this.ressources.length) {
      return;
    }

    this.ressources = this.ressources.filter(
      (_, i) => i !== index
    );

    this.recalculerMontant();
  }

  /**
   * Les champs textuels peuvent être vides.
   * Une liste de ressources vide est également autorisée.
   */
  enregistrer(): void {
    if (!this.rapport || this.enregistrement) {
      return;
    }

    for (const ressource of this.ressources) {
      const quantite = Number(ressource.quantite);
      const prix = Number(ressource.prixUnitaire);

      if (
        !Number.isFinite(quantite) ||
        !Number.isFinite(prix) ||
        quantite < 0 ||
        prix < 0
      ) {
        this.notificationService.erreur(
          'Vérifie les quantités et les prix des ressources.'
        );
        return;
      }
    }

    this.enregistrement = true;

    const donnees = {
      descriptionTechnique: this.descriptionTechnique.trim(),
      rapportBesoinId: this.rapport.rapportBesoinId,
      montantFinal: this.montantTotal,

      details: this.ressources.map(ressource => ({
        // Indispensable pour reconnaître un détail existant.
        ...(ressource.id != null
          ? { id: ressource.id }
          : {}),

        designation: ressource.designation?.trim() ?? '',
        quantite: Number(ressource.quantite) || 0,
        unite: ressource.unite?.trim() ?? '',
        prixUnitaire: Number(ressource.prixUnitaire) || 0
      }))
    };

    this.rapportTechniqueService
      .modifier(this.rapportId, donnees)
      .pipe(
        finalize(() => {
          this.enregistrement = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.notificationService.succes(
            'Rapport technique modifié avec succès.'
          );

          this.router.navigate(
            ['/organisation/etudes-terrain']
          );
        },
        error: err => {
          console.error(
            'Erreur de modification du rapport :',
            err
          );

          this.notificationService.erreur(
            err?.error?.message ??
            'Impossible de modifier le rapport technique.'
          );
        }
      });
  }

  annuler(): void {
    this.router.navigate(['/organisation/etudes-terrain']);
  }
}
