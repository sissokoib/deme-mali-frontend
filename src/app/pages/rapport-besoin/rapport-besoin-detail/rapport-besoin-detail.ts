
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { RapportBesoinService } from '../../../services/rapport-bessoin';
import { RapportBesoin } from '../../../models/rapport-besoin.model';
import { NotificationService } from '../../../services/notification';

@Component({
  selector: 'app-detail-rapport-besoin',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './rapport-besoin-detail.html',
  styleUrl: './rapport-besoin-detail.css'
})
export class DetailRapportBesoin implements OnInit {

  rapport: RapportBesoin | null = null;
  chargement = true;
  erreur = '';
  demandeValidee = false;

  private rapportId = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private rapportBesoinService: RapportBesoinService,
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

    this.chargerRapport(this.rapportId);
  }

  chargerRapport(id: number): void {
    this.chargement = true;
    this.erreur = '';

    this.rapportBesoinService.getById(id).subscribe({
      next: (rapport) => {
        console.log('Rapport reçu :', rapport);

        this.rapport = rapport;

        this.demandeValidee =
          rapport.statutDemande?.trim().toUpperCase() === 'VALIDEE';

        console.log('Statut de la demande :', rapport.statutDemande);
        console.log('Demande validée ?', this.demandeValidee);

        this.chargement = false;

        // Actualiser l'affichage après la réception des données
        this.cdr.detectChanges();
      },

      error: (err) => {
        console.error('Erreur chargement rapport :', err);

        this.erreur = err.error?.message
          || 'Impossible de charger le rapport de besoin.';

        this.chargement = false;

        this.notificationService.erreur(this.erreur);
        this.cdr.detectChanges();
      }
    });
  }

  modifierRapport(): void {
    // Bloquer la modification si la demande est validée
    if (!this.rapport || this.demandeValidee) {
      return;
    }

    this.router.navigate([
      '/organisation/etudes-terrain/rapport-besoin/modifier',
      this.rapport.id
    ]);
  }

  retour(): void {
    if (this.rapport?.etudeTerrainId) {
      this.router.navigate([
        '/organisation/etudes-terrain/detail',
        this.rapport.etudeTerrainId
      ]);
    } else {
      this.router.navigate([
        '/organisation/etudes-terrain'
      ]);
    }
  }
}
