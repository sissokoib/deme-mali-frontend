
import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { AideDistribuee } from '../../../../models/aide-distribuee.model';
import { Demande } from '../../../../models/demande.model';
import { PreuveDistribution } from '../../../../models/preuve-distribution.model';

import { AideDistribueeService } from '../../../../services/aides-distribuees';
import { demandeAideService } from '../../../../services/demande-aide';
import { PreuveDistributionService } from '../../../../services/preuve-distribution.service';
import { NotificationService } from '../../../../services/notification';

@Component({
  selector: 'app-detail-aide-distribuee',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule
  ],
  templateUrl: './detail-aide-distribuee.html',
  styleUrl: './detail-aide-distribuee.css'
})
export class DetailAideDistribueeComponent implements OnInit {

  aide: AideDistribuee | null = null;
  demande: Demande | null = null;

  chargement = false;
  messageErreur = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private aideService: AideDistribueeService,
    private demandeService: demandeAideService,
    private preuveService: PreuveDistributionService,
    private cdr: ChangeDetectorRef,
    private notifService:NotificationService
  ) {}

  // =========================================
  // INITIALISATION
  // =========================================

  ngOnInit(): void {
    this.route.paramMap.subscribe({
      next: (params) => {
        const id = Number(params.get('id'));

        if (!Number.isInteger(id) || id <= 0) {
          this.messageErreur =
            'Identifiant de distribution invalide.';

          this.chargement = false;
          this.aide = null;
          this.demande = null;

          this.cdr.detectChanges();
          return;
        }

        this.chargerDetail(id);
      },

      error: (erreur) => {
        console.error(
          'Erreur de lecture de la route :',
          erreur
        );

        this.messageErreur =
          'Impossible de récupérer l’identifiant de la distribution.';

        this.chargement = false;
        this.cdr.detectChanges();
      }
    });
  }

  // =========================================
  // CHARGEMENT DU DÉTAIL
  // =========================================

  chargerDetail(id: number): void {
    this.chargement = true;
    this.messageErreur = '';
    this.aide = null;
    this.demande = null;

    this.cdr.detectChanges();

    this.aideService.getById(id).subscribe({
      next: (aide) => {
        this.aide = aide;

      if (aide.demandeAideId == null) {
  this.notifService.erreur(
    'Aucune demande d’aide n’est associée à cette distribution.'
  );

  this.chargement = false;
  this.cdr.detectChanges();
  return;
}

        this.demandeService
          .getById(aide.demandeAideId)
          .subscribe({
            next: (demande) => {
              this.demande = demande;
              this.chargement = false;

              this.cdr.detectChanges();
            },

            error: (erreur) => {
              console.error(
                'Erreur de chargement de la demande :',
                erreur
              );

              this.messageErreur =
                'Impossible de charger la demande associée.';

              this.chargement = false;
              this.cdr.detectChanges();
            }
          });
      },

      error: (erreur) => {
        console.error(
          'Erreur de chargement de la distribution :',
          erreur
        );

        this.messageErreur =
          erreur?.error?.message ??
          'Impossible de charger le détail de la distribution.';

        this.chargement = false;
        this.cdr.detectChanges();
      }
    });
  }


  demandeAideType(
    type: 'FINANCIERE' | 'MATERIELLE'
  ): boolean {
    return this.demande?.typeDemandeAide === type;
  }

 
  calculerTotalFinancier = (
    total: number,
    affectation: {
      montantAffecte?: number | null;
    }
  ): number => {
    return total + (affectation.montantAffecte ?? 0);
  };

  /**
   * Additionne les valeurs des affectations matérielles.
   */
  calculerTotalMateriel = (
    total: number,
    affectation: {
      valeurAffectee?: number | null;
    }
  ): number => {
    return total + (affectation.valeurAffectee ?? 0);
  };

  // =========================================
  // GESTION DES PREUVES
  // =========================================

  // Construire l'URL publique d'une preuve.
  urlPreuve(url: string): string {
    return this.preuveService.getUrlFichier(url);
  }

  // Vérifier si une preuve est une image.
  estImage(preuve: PreuveDistribution): boolean {
    return preuve.typeMedia === 'IMAGE';
  }

  // Vérifier si une preuve est une vidéo.
  estVideo(preuve: PreuveDistribution): boolean {
    return preuve.typeMedia === 'VIDEO';
  }

  // Vérifier si une preuve est un document.
  estDocument(preuve: PreuveDistribution): boolean {
    return preuve.typeMedia === 'DOCUMENT';
  }

  // =========================================
  // STATUT ET MONTANTS
  // =========================================

  // Afficher un libellé lisible du statut.
  libelleStatut(statut: string): string {
    switch (statut) {
      case 'EN_ATTENTE':
        return 'En attente';

      case 'DISTRIBUEE':
        return 'Distribuée';

      default:
        return statut || 'Non renseigné';
    }
  }

  // Afficher un montant au format FCFA.
  formaterMontant(
    montant: number | null | undefined
  ): string {
    return `${(montant ?? 0).toLocaleString('fr-FR')} FCFA`;
  }

  // =========================================
  // NAVIGATION
  // =========================================

  // Revenir à la liste des distributions.
  retourListe(): void {
    this.router.navigate([
      '/organisation/aide-distribuee'
    ]);
  }

  // Ouvrir la demande associée.
  voirDemande(): void {
    if (this.aide?.demandeAideId != null) {
      this.router.navigate([
        '/organisation/demandes-aide',
        this.aide.demandeAideId
      ]);
    }
  }

  // =========================================
  // CONFIRMATION DE LA DISTRIBUTION
  // =========================================

  confirmerDistribution(): void {
    if (
      !this.aide ||
      this.aide.statut !== 'EN_ATTENTE' ||
      this.chargement
    ) {
      return;
    }

    const confirmation = window.confirm(
      'Voulez-vous confirmer cette distribution ?'
    );

    if (!confirmation) {
      return;
    }

    const id = this.aide.id;

    this.chargement = true;
    this.messageErreur = '';

    this.cdr.detectChanges();

    this.aideService.confirmer(id).subscribe({
      next: () => {
        // Recharger la distribution après confirmation.
        this.aideService.getById(id).subscribe({
          next: (aide) => {
            this.aide = aide;

            // Recharger également la demande associée.
            if (aide.demandeAideId != null) {
              this.demandeService
                .getById(aide.demandeAideId)
                .subscribe({
                  next: (demande) => {
                    this.demande = demande;
                    this.chargement = false;

                    this.cdr.detectChanges();
                  },

                  error: (erreur) => {
                    console.error(
                      'Erreur de rechargement de la demande :',
                      erreur
                    );

                    this.messageErreur =
                      'La distribution a été confirmée, mais la demande n’a pas pu être rechargée.';

                    this.chargement = false;
                    this.cdr.detectChanges();
                  }
                });
            } else {
              this.demande = null;
              this.chargement = false;
              this.cdr.detectChanges();
            }
          },

          error: (erreur) => {
            console.error(
              'Erreur de rechargement de la distribution :',
              erreur
            );

            this.messageErreur =
              'La distribution a été confirmée, mais son détail n’a pas pu être rechargé.';

            this.chargement = false;
            this.cdr.detectChanges();
          }
        });
      },

      error: (erreur) => {
        console.error(
          'Erreur de confirmation :',
          erreur
        );

        this.messageErreur =
          erreur?.error?.message ??
          'Impossible de confirmer la distribution.';

        this.chargement = false;
        this.cdr.detectChanges();
      }
    });
  }
}
