import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
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
    private router: Router,
    private location: Location,
    private dialog: MatDialog,
    private donService: DonService
  ) {}

  ngOnInit(): void {
    this.typeDon = this.route.snapshot.url.some(segment =>
      segment.path === 'materiel'
    ) ? 'MATERIEL' : 'FINANCIER';

    // Le don est transmis depuis la liste lors du clic sur « Détails ».
    const etat = this.location.getState() as { don?: any };
    this.don = etat?.don ?? null;

    if (!this.don) {
      this.erreur =
        'Les détails du don ne sont pas disponibles. Retournez à la liste et ouvrez le don à nouveau.';
      this.chargement = false;
      return;
    }

    this.chargement = false;
  }

  get estMateriel(): boolean {
    return this.typeDon === 'MATERIEL';
  }

  get peutConfirmerReception(): boolean {
    return this.estMateriel &&
      this.don?.statut === 'EN_ATTENTE';
  }

  ouvrirReception(): void {
    if (!this.don || !this.peutConfirmerReception) {
      return;
    }

    const dialogRef = this.dialog.open(ReceptionDonDialogComponent, {
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

    dialogRef.afterClosed().subscribe((result) => {
      if (!result || !this.don) {
        return;
      }

      if (result.action === 'RECEPTION') {
        this.donService.confirmerReception(
          this.don.id,
          result.quantiteRecue
        ).subscribe({
          next: (donMisAJour) => {
            this.don = donMisAJour;
          },
          error: (err) => {
            console.error('Erreur de confirmation de réception :', err);
            this.erreur = 'Impossible de confirmer la réception.';
          }
        });
      }

      if (result.action === 'REFUS') {
        this.donService.refuserDon(
          this.don.id,
          result.motifRefus
        ).subscribe({
          next: (donMisAJour) => {
            this.don = donMisAJour;
          },
          error: (err) => {
            console.error('Erreur de refus du don :', err);
            this.erreur = 'Impossible de refuser le don.';
          }
        });
      }
    });
  }

  retourner(): void {
    this.location.back();
  }
}