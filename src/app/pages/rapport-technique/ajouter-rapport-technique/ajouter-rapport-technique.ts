
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';

import { RapportBesoinService } from '../../../services/rapport-bessoin';
import { RapportTechniqueService } from '../../../services/rapport-technique';
import { NotificationService } from '../../../services/notification';

import { RapportBesoin } from '../../../models/rapport-besoin.model';
import { DetailRapportTechnique } from '../../../models/rapport-technique.model';

interface RessourceTechnique extends DetailRapportTechnique {

}

@Component({
  selector: 'app-ajouter-rapport-technique',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule
  ],
  templateUrl: './ajouter-rapport-technique.html',
  styleUrl: './ajouter-rapport-technique.css'
})
export class AjouterRapportTechnique implements OnInit {

  rapportBesoin: RapportBesoin | null = null;
  rapportBesoinId = 0;

  // À alimenter depuis la demande associée si cette information est disponible.
  nomBeneficiaire = '';

  chargement = true;
  enregistrement = false;
  erreur = '';

  descriptionTechnique = '';
  descriptionTechniqueTouchee = false;

  ressources: RessourceTechnique[] = [];

  champsTouches = false;
  erreurs: { [champ: string]: string } = {};

  nouvelleRessource: RessourceTechnique = {
    designation: '',

    quantite: 1,
    unite: '',
    prixUnitaire: 0,
    montant: 0
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private rapportBesoinService: RapportBesoinService,
    private rapportTechniqueService: RapportTechniqueService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.rapportBesoinId = Number(
      this.route.snapshot.queryParamMap.get('rapportBesoinId')
    );

    if (
      !Number.isInteger(this.rapportBesoinId) ||
      this.rapportBesoinId <= 0
    ) {
      this.erreur = 'Identifiant du rapport de besoin invalide.';
      this.chargement = false;
      return;
    }

    this.chargerRapportBesoin();
  }

  chargerRapportBesoin(): void {
    this.chargement = true;
    this.erreur = '';

    this.rapportBesoinService.getById(this.rapportBesoinId)
      .subscribe({
        next: (rapport: RapportBesoin) => {
          this.rapportBesoin = rapport;
          this.chargement = false;
          this.cdr.detectChanges();
        },
        error: (err: HttpErrorResponse) => {
          this.chargement = false;
          this.erreur =
            err.error?.message ||
            'Impossible de charger le rapport de besoin.';

          this.notificationService.erreur(this.erreur);
          this.cdr.detectChanges();
        }
      });
  }

  validerChamps(): boolean {
    this.erreurs = {};

    if (!this.nouvelleRessource.designation.trim()) {
      this.erreurs['designation'] =
        'La désignation est obligatoire.';
    }

  

    const quantite = Number(this.nouvelleRessource.quantite);

    if (!Number.isFinite(quantite) || quantite <= 0) {
      this.erreurs['quantite'] =
        'La quantité doit être supérieure à zéro.';
    }

    if (!this.nouvelleRessource.unite.trim()) {
      this.erreurs['unite'] = 'L’unité est obligatoire.';
    }

    const prix = Number(this.nouvelleRessource.prixUnitaire);

    if (!Number.isFinite(prix) || prix < 0) {
      this.erreurs['prixUnitaire'] =
        'Le prix ne peut pas être négatif.';
    }

    return Object.keys(this.erreurs).length === 0;
  }

  ajouterRessource(): void {
    this.champsTouches = true;

    if (!this.validerChamps()) {
      return;
    }

    const quantite = Number(this.nouvelleRessource.quantite);
    const prix = Number(this.nouvelleRessource.prixUnitaire);

    const ressource: RessourceTechnique = {
      designation: this.nouvelleRessource.designation.trim(),
     
      quantite,
      unite: this.nouvelleRessource.unite.trim(),
      prixUnitaire: prix,
      montant: quantite * prix
    };

    this.ressources.push(ressource);

    this.nouvelleRessource = {
      designation: '',
    
      quantite: 1,
      unite: '',
      prixUnitaire: 0,
      montant: 0
    };

    this.champsTouches = false;
    this.erreurs = {};
  }

  supprimerRessource(index: number): void {
    if (index < 0 || index >= this.ressources.length) {
      return;
    }

    this.ressources.splice(index, 1);
  }

  calculerMontant(ressource: DetailRapportTechnique): number {
    return Number(ressource.quantite) *
      Number(ressource.prixUnitaire);
  }

  calculerBudgetTotal(): number {
    return this.ressources.reduce(
      (total, ressource) =>
        total + this.calculerMontant(ressource),
      0
    );
  }

  enregistrer(): void {
    if (this.enregistrement) {
      return;
    }

    this.descriptionTechniqueTouchee = true;

    if (!this.descriptionTechnique.trim()) {
      this.notificationService.erreur(
        'La description technique est obligatoire.'
      );
      return;
    }

    if (!this.rapportBesoin) {
      this.notificationService.erreur(
        'Le rapport de besoin associé est introuvable.'
      );
      return;
    }

    if (this.ressources.length === 0) {
      this.notificationService.erreur(
        'Ajoutez au moins un article avant d’enregistrer.'
      );
      return;
    }

    const donnees = {
      descriptionTechnique: this.descriptionTechnique.trim(),
      rapportBesoinId: this.rapportBesoinId,
      montantFinal: this.calculerBudgetTotal(),

      // La catégorie reste locale tant que le backend ne la prend pas en charge.
      details: this.ressources.map(ressource => ({
        designation: ressource.designation,
        quantite: ressource.quantite,
        unite: ressource.unite,
        prixUnitaire: ressource.prixUnitaire
      }))
    };

    this.enregistrement = true;

    this.rapportTechniqueService.creer(donnees).subscribe({
      next: () => {
        this.enregistrement = false;

        this.notificationService.succes(
          'Le rapport technique a été créé avec succès.'
        );

        this.router.navigate(['/organisation/etudes-terrain']);
      },
      error: (err: HttpErrorResponse) => {
        this.enregistrement = false;

        this.notificationService.erreur(
          err.error?.message ||
          'Erreur lors de la création du rapport technique.'
        );

        this.cdr.detectChanges();
      }
    });
  }

  annuler(): void {
    this.router.navigate(['/organisation/etudes-terrain']);
  }
}
