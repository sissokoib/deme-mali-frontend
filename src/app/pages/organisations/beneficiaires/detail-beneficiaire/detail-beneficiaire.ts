
import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { Beneficiaire } from '../../../../models/beneficiaire.model';
import { BeneficiaireService } from '../../../../services/beneficiaire';
import {NotificationService} from '../../../../services/notification';

@Component({
  selector: 'app-detail-beneficiaire',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatIconModule
  ],
  templateUrl: './detail-beneficiaire.html',
  styleUrl: './detail-beneficiaire.css'
})
export class DetailBeneficiaire implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private beneficiaireService = inject(BeneficiaireService);
  private cdr = inject(ChangeDetectorRef);
  private notifServe = inject(NotificationService);

  beneficiaire: Beneficiaire | null = null;

  chargement = true;
  erreur = '';
  message = '';

  popupDecision = false;
  decisionChoisie = '';
  motifDecision = '';
  erreurDecision = '';

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));

      if (!id || isNaN(id)) {
        this.erreur = 'Identifiant du bénéficiaire invalide.';
        this.chargement = false;
        return;
      }

      this.chargerBeneficiaire(id);
    });
  }

  chargerBeneficiaire(id: number): void {
    this.chargement = true;
    this.erreur = '';

    this.beneficiaireService.trouverParId(id).subscribe({
      next: (data) => {
        this.beneficiaire = data;
        this.chargement = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error(
          'Erreur lors du chargement du bénéficiaire :',
          error
        );

        this.erreur = 'Impossible de charger les informations du bénéficiaire.';
        this.chargement = false;
        this.cdr.detectChanges();
      }
    });
  }

  ouvrirDecision(): void {
    this.popupDecision = true;
    this.decisionChoisie = '';
    this.motifDecision = '';
    this.erreurDecision = '';
  }

  fermerDecision(): void {
    this.popupDecision = false;
    this.decisionChoisie = '';
    this.motifDecision = '';
    this.erreurDecision = '';
  }



confirmerDecision(): void {
  this.erreurDecision = '';

  if (!this.beneficiaire) {
    this.erreurDecision = 'Bénéficiaire introuvable.';
    return;
  }

  if (!this.decisionChoisie) {
    this.erreurDecision = 'Veuillez choisir une décision.';
    return;
  }

  if (
    this.decisionChoisie === 'REFUSE' &&
    !this.motifDecision.trim()
  ) {
    this.erreurDecision = 'Veuillez saisir le motif du refus.';
    return;
  }

  const id = this.beneficiaire.id;

  if (this.decisionChoisie === 'ACCEPTE') {
    this.beneficiaireService.accepter(id).subscribe({
      next: () => {
        this.fermerDecision();

        this.notifServe.succes(
          'Le bénéficiaire a été accepté avec succès.'
        );

        this.router.navigate(['/organisation/beneficiaires']);
      },
      error: (error) => {
        console.error('Erreur lors de l’acceptation :', error);
        this.erreurDecision = 'Impossible d’accepter le bénéficiaire.';
      }
    });
  } else if (this.decisionChoisie === 'REFUSE') {
    this.beneficiaireService
      .refuser(id, this.motifDecision.trim())
      .subscribe({
        next: () => {
          this.fermerDecision();

          this.notifServe.succes(
            'Le bénéficiaire a été refusé avec succès.'
          );

          this.router.navigate(['/organisation/beneficiaires']);
        },
        error: (error) => {
          console.error('Erreur lors du refus :', error);
          this.erreurDecision = 'Impossible de refuser le bénéficiaire.';
        }
      });
  }
}


}
