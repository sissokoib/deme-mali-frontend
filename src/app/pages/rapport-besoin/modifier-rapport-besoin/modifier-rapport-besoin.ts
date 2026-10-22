
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

        // Conserver les valeurs existantes du rapport
        this.titre = data.titre ?? '';
        this.besoinIdentifie = data.besoinIdentifie ?? '';
        this.descriptionSituation = data.descriptionSituation ?? '';
        this.solutionProposee = data.solutionProposee ?? '';
        this.montantEstime = data.montantEstime ?? null;

        // Vérifier si la demande est déjà validée
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

    // Vérifier que tous les champs obligatoires sont remplis
    if (form.invalid) {
      form.form.markAllAsTouched();

      this.notificationService.erreur(
        'Veuillez remplir correctement tous les champs obligatoires.'
      );
      return;
    }

    // Vérifier que les champs textuels ne contiennent pas uniquement des espaces
    if (
      !this.titre.trim() ||
      !this.besoinIdentifie.trim() ||
      !this.descriptionSituation.trim() ||
      !this.solutionProposee.trim()
    ) {
      this.notificationService.erreur(
        'Tous les champs textuels sont obligatoires.'
      );
      return;
    }

    // Vérifier que le montant est obligatoire, numérique et strictement positif
    const montant = Number(this.montantEstime);

    if (
      this.montantEstime === null ||
      this.montantEstime === undefined ||
      this.montantEstime === '' as unknown as number ||
      !Number.isFinite(montant) ||
      montant <= 0
    ) {
      this.notificationService.erreur(
        'Le montant estimé est obligatoire et doit être supérieur à zéro.'
      );
      return;
    }

    // Préparer les données sans envoyer de champs vides
    // Les valeurs non modifiées sont conservées dans les propriétés du composant
    const donnees: Partial<RapportBesoin> = {
      titre: this.titre.trim(),
      besoinIdentifie: this.besoinIdentifie.trim(),
      descriptionSituation: this.descriptionSituation.trim(),
      solutionProposee: this.solutionProposee.trim(),
      montantEstime: montant
    };

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
