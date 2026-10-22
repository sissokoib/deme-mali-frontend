
import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { DonService } from '../../../services/don.service.ts';
import { ReceptionDonDialogComponent } from '../../../dialogs/reception-don-dialog.component/reception-don-dialog.component';

@Component({
  selector: 'app-detail-don',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './detail-don.html',
  styleUrl: './detail-don.css'
})
export class DetailDonComponent implements OnInit {

  don: any = null;

  typeDon: 'MATERIEL' | 'FINANCIER' = 'MATERIEL';

  chargement = true;
  erreur = '';

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private dialog: MatDialog,
    private donService: DonService
  ) {}

  ngOnInit(): void {

    // Déterminer le type du don à partir de l'URL
    const segments = this.route.snapshot.url;

    for (const segment of segments) {
      if (segment.path === 'materiel') {
        this.typeDon = 'MATERIEL';
      } else {
        // On conserve le type initial si le segment ne correspond pas.
      }
    }

    // Récupérer le don transmis par la page précédente
    const etat: any = this.location.getState();

    if (etat && etat.don) {
      this.don = etat.don;
    } else {
      this.erreur =
        'Les détails du don ne sont pas disponibles. Retournez à la liste et ouvrez le don à nouveau.';
    }

    this.chargement = false;
  }

  // Vérifier si le don est matériel
  get estMateriel(): boolean {
    return this.typeDon === 'MATERIEL';
  }

  // Afficher le bouton pour tous les dons matériels
  get peutConfirmerReception(): boolean {
    return this.estMateriel;
  }

  // Ouvrir la fenêtre de confirmation ou de refus
  ouvrirReception(): void {

    if (!this.don || !this.estMateriel) {
      return;
    }

    const fenetre = this.dialog.open(ReceptionDonDialogComponent, {
      width: '500px',
      maxWidth: '95vw',
      data: {
        id: this.don.id,
        designation: this.don.designation,
        quantite: Number(this.don.quantite ?? 1),
        quantiteRecue: this.don.quantiteRecue,
        unite: this.don.unite
      }
    });

    // Récupérer le choix fait dans la fenêtre
    fenetre.afterClosed().subscribe((result) => {

      if (!result) {
        return;
      }

      // Si l'utilisateur confirme la réception
      if (result.action === 'RECEPTION') {

        this.donService.confirmerReception(
          this.don.id,
          result.quantiteRecue
        ).subscribe({

          next: (donMisAJour) => {
            this.don = donMisAJour;
          },

          error: (err) => {
            console.error(err);
            this.erreur = 'Impossible de confirmer la réception.';
          }

        });
      }

      // Si l'utilisateur refuse le don
      else if (result.action === 'REFUS') {

        this.donService.refuserDon(
          this.don.id,
          result.motifRefus
        ).subscribe({

          next: (donMisAJour) => {
            this.don = donMisAJour;
          },

          error: (err) => {
            console.error(err);
            this.erreur = 'Impossible de refuser le don.';
          }

        });
      }

    });
  }

  // Retourner à la page précédente
  retourner(): void {
    this.location.back();
  }

}
