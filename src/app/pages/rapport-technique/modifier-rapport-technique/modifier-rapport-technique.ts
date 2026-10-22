
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

interface ErreursRessource {
  designation?: string;
  unite?: string;
  quantite?: string;
  prixUnitaire?: string;
}

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

  nouvelleRessource: DetailRapportTechnique =
    this.creerRessourceVide();

  chargement = true;
  enregistrement = false;
  erreur = '';

  // Erreurs affichées directement dans le formulaire.
  erreurDescription = '';
  erreurListeRessources = '';

  erreursNouvelleRessource: ErreursRessource = {};
  erreursRessources: { [index: number]: ErreursRessource } = {};

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

          const details = (rapport.details ?? []).map(detail => {
            const quantite = Number(detail.quantite) || 0;
            const prixUnitaire = Number(detail.prixUnitaire) || 0;

            return {
              ...detail,
              quantite,
              prixUnitaire,
              montant: quantite * prixUnitaire
            };
          });

          // Conserve le comportement existant de regroupement.
          this.ressources = this.regrouperRessources(details);

          this.recalculerMontant();
        },
        error: err => {
          console.error('Erreur de chargement :', err);
          this.erreur =
            'Impossible de charger le rapport technique.';
        }
      });
  }

  private regrouperRessources(
    details: DetailRapportTechnique[]
  ): DetailRapportTechnique[] {
    const ressourcesRegroupees: DetailRapportTechnique[] = [];

    for (const detail of details) {
      const designation = detail.designation?.trim() ?? '';
      const unite = detail.unite?.trim() ?? '';
      const prix = Number(detail.prixUnitaire);

      const existant = ressourcesRegroupees.find(ressource =>
        ressource.designation.trim().toLowerCase() ===
          designation.toLowerCase() &&
        ressource.unite.trim().toLowerCase() ===
          unite.toLowerCase() &&
        Number(ressource.prixUnitaire) === prix
      );

      if (existant) {
        existant.quantite =
          Number(existant.quantite) + Number(detail.quantite);

        existant.montant = existant.quantite * prix;
      } else {
        ressourcesRegroupees.push({
          ...detail,
          designation,
          unite,
          quantite: Number(detail.quantite),
          prixUnitaire: prix,
          montant: Number(detail.quantite) * prix
        });
      }
    }

    return ressourcesRegroupees;
  }

  calculerMontant(ressource: DetailRapportTechnique): number {
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

  recalculerMontant(): void {
    this.ressources = this.ressources.map(ressource => ({
      ...ressource,
      montant: this.calculerMontant(ressource)
    }));
  }

  ajouterRessource(): void {
    this.erreursNouvelleRessource = {};

    const designation =
      this.nouvelleRessource.designation?.trim() ?? '';

    const unite =
      this.nouvelleRessource.unite?.trim() ?? '';

    const quantiteVide =
      String(this.nouvelleRessource.quantite ?? '').trim() === '';

    const prixVide =
      String(this.nouvelleRessource.prixUnitaire ?? '').trim() === '';

    const quantite = Number(this.nouvelleRessource.quantite);
    const prix = Number(this.nouvelleRessource.prixUnitaire);

    if (!designation) {
      this.erreursNouvelleRessource.designation =
        'La désignation est obligatoire.';
    }

    if (!unite) {
      this.erreursNouvelleRessource.unite =
        'L’unité est obligatoire.';
    }

    if (
      quantiteVide ||
      !Number.isFinite(quantite) ||
      quantite <= 0
    ) {
      this.erreursNouvelleRessource.quantite =
        'La quantité doit être supérieure à zéro.';
    }

    if (
      prixVide ||
      !Number.isFinite(prix) ||
      prix <= 0
    ) {
      this.erreursNouvelleRessource.prixUnitaire =
        'Le prix unitaire doit être supérieur à zéro.';
    }

    if (Object.keys(this.erreursNouvelleRessource).length > 0) {
      return;
    }

    const articleExistant = this.ressources.find(ressource =>
      ressource.designation.trim().toLowerCase() ===
        designation.toLowerCase() &&
      ressource.unite.trim().toLowerCase() ===
        unite.toLowerCase() &&
      Number(ressource.prixUnitaire) === prix
    );

    if (articleExistant) {
      articleExistant.quantite =
        Number(articleExistant.quantite) + quantite;

      articleExistant.montant =
        articleExistant.quantite * prix;

      this.ressources = [...this.ressources];
    } else {
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
    }

    this.nouvelleRessource = this.creerRessourceVide();
    this.erreursNouvelleRessource = {};
    this.erreurListeRessources = '';

    this.recalculerMontant();
  }

  supprimerRessource(index: number): void {
    if (index < 0 || index >= this.ressources.length) {
      return;
    }

    this.ressources = this.ressources.filter(
      (_, i) => i !== index
    );

    this.erreursRessources = {};
    this.erreurListeRessources = this.ressources.length === 0
      ? 'Le rapport doit contenir au moins un article.'
      : '';

    this.recalculerMontant();
  }

  enregistrer(): void {
    if (!this.rapport || this.enregistrement) {
      return;
    }

    // Réinitialise les erreurs de validation précédentes.
    this.erreurDescription = '';
    this.erreurListeRessources = '';
    this.erreursRessources = {};

    let formulaireValide = true;

    if (!this.descriptionTechnique.trim()) {
      this.erreurDescription =
        'La description technique est obligatoire.';
      formulaireValide = false;
    }

    if (this.ressources.length === 0) {
      this.erreurListeRessources =
        'Le rapport doit contenir au moins un article.';
      formulaireValide = false;
    }

    this.ressources.forEach((ressource, index) => {
      const erreurs: ErreursRessource = {};

      const designation =
        ressource.designation?.trim() ?? '';

      const unite =
        ressource.unite?.trim() ?? '';

      const quantiteVide =
        String(ressource.quantite ?? '').trim() === '';

      const prixVide =
        String(ressource.prixUnitaire ?? '').trim() === '';

      const quantite = Number(ressource.quantite);
      const prix = Number(ressource.prixUnitaire);

      if (!designation) {
        erreurs.designation = 'La désignation est obligatoire.';
      }

      if (!unite) {
        erreurs.unite = 'L’unité est obligatoire.';
      }

      if (
        quantiteVide ||
        !Number.isFinite(quantite) ||
        quantite <= 0
      ) {
        erreurs.quantite =
          'La quantité doit être supérieure à zéro.';
      }

      if (
        prixVide ||
        !Number.isFinite(prix) ||
        prix <= 0
      ) {
        erreurs.prixUnitaire =
          'Le prix unitaire doit être supérieur à zéro.';
      }

      if (Object.keys(erreurs).length > 0) {
        this.erreursRessources[index] = erreurs;
        formulaireValide = false;
      }
    });

    // Aucune notification pour une simple erreur de formulaire.
    if (!formulaireValide) {
      return;
    }

    this.enregistrement = true;

    // Le format envoyé au backend reste inchangé.
    const donnees = {
      descriptionTechnique: this.descriptionTechnique.trim(),
      rapportBesoinId: this.rapport.rapportBesoinId,
      montantFinal: this.montantTotal,

      details: this.ressources.map(ressource => ({
        ...(ressource.id != null
          ? { id: ressource.id }
          : {}),
        designation: ressource.designation.trim(),
        quantite: Number(ressource.quantite),
        unite: ressource.unite.trim(),
        prixUnitaire: Number(ressource.prixUnitaire)
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
          // Notification uniquement après succès du backend.
          this.notificationService.succes(
            'Rapport technique modifié avec succès.'
          );

          this.router.navigate([
            '/organisation/etudes-terrain'
          ]);
        },
        error: err => {
          console.error(
            'Erreur de modification du rapport :',
            err
          );

          // Notification uniquement si la requête échoue.
          this.notificationService.erreur(
            err?.error?.message ??
            'Impossible de modifier le rapport technique.'
          );
        }
      });
  }

  annuler(): void {
    this.router.navigate([
      '/organisation/etudes-terrain'
    ]);
  }
}
