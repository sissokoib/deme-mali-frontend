
import {
  Component,
  inject,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AideDistribueeService } from '../../../../services/aides-distribuees';
import { AuthService } from '../../../../services/auth.service';
import { demandeAideService } from '../../../../services/demande-aide';
import { PreuveService } from '../../../../services/preuve';
import { NotificationService } from '../../../../services/notification';

import {
  AideDistribueeRequest,
  AideDistribueeResponse,
  ModeDistribution,
  MODES_DISTRIBUTION
} from '../../../../models/aide-distribuee.model';

import { Demande } from '../../../../models/demande.model';

@Component({
  selector: 'app-ajout-aide-distribuee',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ajout-aide-distribuee.html',
  styleUrl: './ajout-aide-distribuee.css'
})
export class AjoutAideDistribueeComponent implements OnInit {

  private aideService = inject(AideDistribueeService);
  private authService = inject(AuthService);
  private demandeService = inject(demandeAideService);
  private preuveService = inject(PreuveService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  organisationId: number | null = null;

  demandes: Demande[] = [];
  fichierPreuve: File | null = null;

  modesDistribution: ModeDistribution[] = MODES_DISTRIBUTION;

  chargement = false;
  chargementDemandes = false;

  aide: AideDistribueeRequest = {
    dateDistribution: '',
    montantDistribue: null,
    quantiteDistribue: null,
    unite: '',
    modeDistribution: 'ESPECES',
    lieuDistribution: '',
    statut: 'EN_ATTENTE',
    organisateurId: 0,
    demandeAideId: 0
  };

  ngOnInit(): void {
    const utilisateur = this.authService.getCurrentUser();

    if (!utilisateur || !utilisateur.id) {
      this.notificationService.erreur(
        'Impossible de récupérer l’organisation connectée.'
      );
      return;
    }

    this.organisationId = Number(utilisateur.id);
    this.aide.organisateurId = this.organisationId;

    this.chargerDemandes();
  }

  chargerDemandes(): void {
    if (this.organisationId === null) {
      return;
    }

    this.chargementDemandes = true;

    this.demandeService
      .getDemandesTermineesPourAideDistribuee(this.organisationId)
      .subscribe({
        next: (demandes: Demande[]) => {
          this.demandes = demandes.filter(
            (demande: Demande) =>
              demande.statut === 'VALIDEE' &&
              demande.statutCollecte === 'TERMINEE'
          );

          this.chargementDemandes = false;
          this.cdr.detectChanges();

          if (this.demandes.length === 0) {
            this.notificationService.info(
              'Aucune demande validée avec une collecte terminée n’est disponible.'
            );
          }
        },

        error: (erreur: unknown) => {
          console.error(erreur);

          this.chargementDemandes = false;
          this.cdr.detectChanges();

          this.notificationService.erreur(
            'Impossible de charger les demandes disponibles.'
          );
        }
      });
  }

  choisirPreuve(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.fichierPreuve =
      input.files && input.files.length > 0
        ? input.files[0]
        : null;
  }

  enregistrer(): void {
    if (this.chargement) {
      return;
    }

    if (this.organisationId === null) {
      this.notificationService.erreur(
        'Aucune organisation connectée.'
      );
      return;
    }

    const demandeSelectionnee = this.demandes.some(
      (demande: Demande) =>
        demande.id === this.aide.demandeAideId &&
        demande.statut === 'VALIDEE' &&
        demande.statutCollecte === 'TERMINEE'
    );

    if (!demandeSelectionnee) {
      this.notificationService.erreur(
        'Veuillez sélectionner une demande validée dont la collecte est terminée.'
      );
      return;
    }

    if (
      !this.aide.dateDistribution ||
      !this.aide.lieuDistribution.trim()
    ) {
      this.notificationService.erreur(
        'Veuillez remplir les champs obligatoires.'
      );
      return;
    }

    this.aide.organisateurId = this.organisationId;
    this.chargement = true;

    const fichier = this.fichierPreuve;

    this.aideService.creer(this.aide).subscribe({
      next: (reponse: AideDistribueeResponse) => {

        if (!fichier) {
          this.notificationService.succes(
            'Aide distribuée enregistrée avec succès.'
          );

          this.chargement = false;
          this.router.navigate(['/organisation/aides-distribuees']);
          return;
        }

        this.preuveService
          .uploaderPreuve(reponse.id, fichier)
          .subscribe({
            next: () => {
              this.notificationService.succes(
                'Aide distribuée et preuve enregistrées avec succès.'
              );

              this.chargement = false;
              this.router.navigate(['/organisation/aides-distribuees']);
            },

            error: (erreur: unknown) => {
              console.error(erreur);

              this.chargement = false;

              this.notificationService.erreur(
                'L’aide est enregistrée, mais l’envoi de la preuve a échoué.'
              );
            }
          });
      },

      error: (erreur: any) => {
        console.error(erreur);

        this.chargement = false;

        this.notificationService.erreur(
          erreur?.error?.message ||
          'Erreur lors de l’enregistrement de l’aide distribuée.'
        );
      }
    });
  }

  annuler(): void {
    this.router.navigate(['/organisation/aides-distribuees']);
  }
}
