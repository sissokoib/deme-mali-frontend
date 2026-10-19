
import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { AideDistribuee } from '../../../models/aide-distribuee.model';
import { Demande } from '../../../models/demande.model';

import { AideDistribueeService } from '../../../services/aides-distribuees';
import { demandeAideService } from '../../../services/demande-aide';
import { PreuveDistributionService } from '../../../services/preuve-distribution.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-aides-distribuees',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './aides-distribuees.html',
  styleUrl: './aides-distribuees.css'
})
export class AidesDistribueesComponent implements OnInit {

  distributions: AideDistribuee[] = [];
  demandes: Demande[] = [];

  chargement = false;
  chargementDemandes = false;

  messageErreur = '';

  private organisationId: number | null = null;

  constructor(
    private aideService: AideDistribueeService,
    private demandeService: demandeAideService,
    private preuveService: PreuveDistributionService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('Initialisation de la page Aides distribuées');

    console.log(
      'Utilisateur actuel :',
      this.authService.getCurrentUser()
    );

    this.recupererOrganisation();
  }

  /**
   * Récupère l'identifiant de l'organisation connectée.
   */
  recupererOrganisation(): void {
    const utilisateur = this.authService.getCurrentUser() as any;

    if (!utilisateur) {
      this.messageErreur = 'Aucun utilisateur connecté.';
      this.cdr.detectChanges();
      return;
    }

    if (utilisateur.role !== 'ORGANISATIONPARTENAIRE') {
      this.messageErreur =
        'Cette page est réservée aux organisations partenaires.';

      this.cdr.detectChanges();
      return;
    }

    const id =
      utilisateur.organisationPartenaireId ??
      utilisateur.organisationId ??
      utilisateur.organisationPartenaire?.id ??
      utilisateur.organisation?.id ??
      utilisateur.id;

    const organisationId = Number(id);

    if (
      id === null ||
      id === undefined ||
      !Number.isInteger(organisationId) ||
      organisationId <= 0
    ) {
      console.error(
        'Identifiant de l’organisation introuvable :',
        utilisateur
      );

      this.messageErreur =
        'Impossible de déterminer l’identifiant de votre organisation.';

      this.cdr.detectChanges();
      return;
    }

    this.organisationId = organisationId;

    console.log(
      'Identifiant de l’organisation :',
      this.organisationId
    );

    this.cdr.detectChanges();

    this.chargerDistributions();
    this.chargerDemandes();
  }

  /**
   * Charge les distributions de l'organisation.
   */
  chargerDistributions(): void {
    if (this.organisationId === null) {
      return;
    }

    this.chargement = true;
    this.messageErreur = '';

    this.cdr.detectChanges();

    this.aideService
      .getByOrganisation(this.organisationId)
      .subscribe({
        next: (resultat) => {
          this.distributions = resultat ?? [];
          this.chargement = false;

          console.log(
            'Distributions reçues :',
            this.distributions
          );

          this.cdr.detectChanges();
        },

        error: (erreur) => {
          console.error(
            'Erreur de chargement des distributions :',
            erreur
          );

          this.messageErreur =
            'Impossible de charger les distributions de votre organisation.';

          this.chargement = false;

          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Charge les demandes éligibles.
   */
  chargerDemandes(): void {
    if (this.organisationId === null) {
      return;
    }

    this.chargementDemandes = true;

    this.cdr.detectChanges();

    this.demandeService
      .getTermineesPourAideDistribuee(this.organisationId)
      .subscribe({
        next: (resultat) => {
          this.demandes = resultat ?? [];
          this.chargementDemandes = false;

          console.log(
            'Demandes éligibles reçues :',
            this.demandes
          );

          this.cdr.detectChanges();
        },

        error: (erreur) => {
          console.error(
            'Erreur de chargement des demandes :',
            erreur
          );

          this.messageErreur =
            'Impossible de charger les demandes éligibles.';

          this.chargementDemandes = false;

          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Recherche une demande par son identifiant.
   */
  trouverDemande(id: number | null): Demande | undefined {
    if (id === null) {
      return undefined;
    }

    return this.demandes.find(
      demande => demande.id === id
    );
  }

  /**
   * Construit l'URL d'une preuve.
   */
  urlPreuve(url: string): string {
    return this.preuveService.getUrlFichier(url);
  }

  /**
   * Retourne la première preuve image.
   */
  obtenirImage(
    aide: AideDistribuee
  ): AideDistribuee['preuves'][number] | undefined {
    return aide.preuves?.find(
      preuve => preuve.typeMedia === 'IMAGE'
    );
  }

  /**
   * Retourne la première preuve vidéo.
   */
  obtenirVideo(
    aide: AideDistribuee
  ): AideDistribuee['preuves'][number] | undefined {
    return aide.preuves?.find(
      preuve => preuve.typeMedia === 'VIDEO'
    );
  }

  /**
   * Vérifie si la distribution possède des preuves.
   */
  possedePreuve(aide: AideDistribuee): boolean {
    return (aide.preuves?.length ?? 0) > 0;
  }

  /**
   * Ouvre la page d'ajout.
   */
  nouvelleDistribution(): void {
    this.router.navigate([
      '/organisation/aide-distribuee/ajouter'
    ]);
  }

  /**
   * Ouvre le détail d'une distribution.
   */
  voirDetail(id: number): void {
    this.router.navigate([
      '/organisation/aide-distribuee',
      id
    ]);
  }
}
