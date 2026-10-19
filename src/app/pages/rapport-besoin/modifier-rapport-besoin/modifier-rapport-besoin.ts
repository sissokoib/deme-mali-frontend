
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { RapportBesoinService } from '../../../services/rapport-bessoin';
import { NotificationService } from '../../../services/notification';
import { RapportBesoin } from '../../../models/rapport-besoin.model';

@Component({
  selector: 'app-rapport-besoin-modifier',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './modifier-rapport-besoin.html',
  styleUrl: './modifier-rapport-besoin.css'
})
export class RapportBesoinModifier implements OnInit {

  rapport: RapportBesoin | null = null;

  rapportId = 0;
  chargement = true;
  enregistrement = false;
  erreur = '';
  demandeValidee = false;

  titre = '';
  besoinIdentifie = '';
  descriptionSituation = '';
  solutionProposee = '';
  montantEstime: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private rapportService: RapportBesoinService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.rapportId = Number(
      this.route.snapshot.paramMap.get('id')
    );

    if (!Number.isInteger(this.rapportId) || this.rapportId <= 0) {
      this.erreur = 'Identifiant du rapport invalide.';
      this.chargement = false;
      this.cdr.detectChanges();
      return;
    }

    this.chargerRapport();
  }

  chargerRapport(): void {
    this.chargement = true;
    this.erreur = '';

    this.rapportService.getById(this.rapportId).subscribe({

      next: (data) => {
        this.rapport = data;

        // Remplir les champs avec les données existantes
        this.titre = data.titre ?? '';
        this.besoinIdentifie = data.besoinIdentifie ?? '';
        this.descriptionSituation = data.descriptionSituation ?? '';
        this.solutionProposee = data.solutionProposee ?? '';
        this.montantEstime = data.montantEstime ?? null;

        // Vérifier si la demande est validée
        this.demandeValidee =
          data.statutDemande?.trim().toUpperCase() === 'VALIDEE';

        this.chargement = false;
        this.cdr.detectChanges();
      },

      error: (err) => {
        this.chargement = false;

        this.erreur =
          err.error?.message ||
          'Impossible de charger le rapport de besoin.';

        this.notificationService.erreur(this.erreur);
        this.cdr.detectChanges();
      }

    });
  }

  enregistrer(form: NgForm): void {

    if (this.enregistrement || !this.rapport) {
      return;
    }

    // Bloquer la modification si la demande est validée
    if (this.demandeValidee) {
      this.notificationService.erreur(
        'Impossible de modifier ce rapport : la demande est déjà validée.'
      );
      return;
    }

    // Vérifier le montant seulement s'il est renseigné
    if (
      this.montantEstime !== null &&
      (
        !Number.isFinite(this.montantEstime) ||
        this.montantEstime <= 0
      )
    ) {
      this.notificationService.erreur(
        'Le montant doit être supérieur à zéro.'
      );
      return;
    }

    // Préparer les données à envoyer
    const donnees: Partial<RapportBesoin> = {
      titre: this.titre.trim(),
      besoinIdentifie: this.besoinIdentifie.trim(),
      descriptionSituation: this.descriptionSituation.trim(),
      solutionProposee: this.solutionProposee.trim()
    };

    // Ajouter le montant uniquement s'il est renseigné
    if (this.montantEstime !== null) {
      donnees.montantEstime = this.montantEstime;
    }

    this.enregistrement = true;
    this.cdr.detectChanges();

    this.rapportService.modifier(this.rapportId, donnees).subscribe({

      next: (rapportModifie) => {
        this.rapport = rapportModifie;
        this.enregistrement = false;

        this.notificationService.succes(
          'Le rapport de besoin a été modifié avec succès.'
        );

        this.cdr.detectChanges();

        this.router.navigate([
          '/organisation/etudes-terrain/rapport-besoin/detail',
          this.rapportId
        ]);
      },

      error: (err) => {
        this.enregistrement = false;

        const message =
          err.error?.message ||
          'Erreur lors de la modification du rapport.';

        this.notificationService.erreur(message);
        this.cdr.detectChanges();
      }

    });
  }

  retour(): void {
    this.router.navigate([
      '/organisation/etudes-terrain/rapport-besoin/detail',
      this.rapportId
    ]);
  }
}
