
import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AideDistribueeService } from '../../../../services/aides-distribuees';
import { demandeAideService } from '../../../../services/demande-aide';
import { BeneficiaireService } from '../../../../services/beneficiaire';
import { PreuveDistributionService } from '../../../../services/preuve-distribution.service';
import { AuthService } from '../../../../services/auth.service';
import { NotificationService } from '../../../../services/notification';

import { Demande } from '../../../../models/demande.model';
import { Beneficiaire } from '../../../../models/beneficiaire.model';
import { AideDistribueeRequest } from '../../../../models/aide-distribuee.model';
import { TypeMedia } from '../../../../models/preuve-distribution.model';

import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-ajout-aide-distribuee',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule
  ],
  templateUrl: './ajout-aide-distribuee.html',
  styleUrl: './ajout-aide-distribuee.css'
})
export class AjoutAideDistribueeComponent implements OnInit {

  demandes: Demande[] = [];
  beneficiaires: Beneficiaire[] = [];

  demandeAideId: number | null = null;
  beneficiaireId: number | null = null;

  dateDistribution = new Date().toISOString().slice(0, 10);
  lieuDistribution = '';

  fichiersSelectionnes: File[] = [];

  chargementDemandes = false;
  chargementBeneficiaires = false;
  enregistrement = false;

  // Conservés pour compatibilité avec le HTML existant.
  messageErreur = '';
  messageSucces = '';

  formulaireSoumis = false;

  erreursChamps: {
    cible?: string;
    dateDistribution?: string;
    lieuDistribution?: string;
    preuve?: string;
  } = {};

  private organisationId: number | null = null;

  private readonly TAILLE_MAX_IMAGE_DOCUMENT = 100 * 1024 * 1024;
  private readonly TAILLE_MAX_VIDEO = 200 * 1024 * 1024;

  constructor(
    private readonly aideDistribueeService: AideDistribueeService,
    private readonly demandeService: demandeAideService,
    private readonly beneficiaireService: BeneficiaireService,
    private readonly preuveDistributionService: PreuveDistributionService,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly notificationService: NotificationService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.recupererOrganisation();
  }

  // Récupérer l'organisation connectée.
  recupererOrganisation(): void {
    const utilisateur = this.authService.getCurrentUser() as any;

    if (!utilisateur) {
      this.notificationService.erreur(
        'Aucun utilisateur connecté.'
      );
      return;
    }

    if (utilisateur.role !== 'ORGANISATIONPARTENAIRE') {
      this.notificationService.erreur(
        'Cette page est réservée aux organisations partenaires.'
      );
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
      this.notificationService.erreur(
        'Impossible de déterminer l’identifiant de votre organisation.'
      );
      return;
    }

    this.organisationId = organisationId;

    this.chargerDemandes();
    this.chargerBeneficiaires();

    this.actualiserAffichage();
  }

  // Charger les demandes éligibles à une distribution.
  chargerDemandes(): void {
    if (this.organisationId === null) {
      return;
    }

    this.chargementDemandes = true;
    this.actualiserAffichage();

    this.demandeService
      .getTermineesPourAideDistribuee(this.organisationId)
      .subscribe({
        next: (resultat: Demande[]) => {
          this.demandes = resultat ?? [];
          this.chargementDemandes = false;

          this.actualiserAffichage();
        },

        error: (erreur) => {
          console.error('Erreur chargement demandes :', erreur);

          this.demandes = [];
          this.chargementDemandes = false;

          this.notificationService.erreur(
            'Impossible de charger les demandes éligibles.'
          );

          this.actualiserAffichage();
        }
      });
  }

  // Charger les bénéficiaires acceptés par l'organisation.
  chargerBeneficiaires(): void {
    if (this.organisationId === null) {
      return;
    }

    this.chargementBeneficiaires = true;
    this.actualiserAffichage();

    this.beneficiaireService
      .trouverAcceptesParOrganisation(this.organisationId)
      .subscribe({
        next: (resultat: Beneficiaire[]) => {
          this.beneficiaires = resultat ?? [];
          this.chargementBeneficiaires = false;

          this.actualiserAffichage();
        },

        error: (erreur) => {
          console.error(
            'Erreur chargement bénéficiaires :',
            erreur
          );

          this.beneficiaires = [];
          this.chargementBeneficiaires = false;

          this.notificationService.erreur(
            'Impossible de charger les bénéficiaires acceptés.'
          );

          this.actualiserAffichage();
        }
      });
  }

  // Sélectionner une demande d'aide.
  selectionnerDemande(
    valeur: string | number | null
  ): void {
    this.demandeAideId =
      valeur === '' || valeur === null
        ? null
        : Number(valeur);

    if (this.demandeAideId !== null) {
      this.beneficiaireId = null;
    }

    this.effacerErreurCible();
    this.actualiserAffichage();
  }

  // Sélectionner un bénéficiaire.
  selectionnerBeneficiaire(
    valeur: string | number | null
  ): void {
    this.beneficiaireId =
      valeur === '' || valeur === null
        ? null
        : Number(valeur);

    if (this.beneficiaireId !== null) {
      this.demandeAideId = null;
    }

    this.effacerErreurCible();
    this.actualiserAffichage();
  }

  // Effacer l'erreur de sélection lorsque la cible est choisie.
  private effacerErreurCible(): void {
    if (
      this.demandeAideId !== null ||
      this.beneficiaireId !== null
    ) {
      delete this.erreursChamps.cible;
    }
  }

  // Sélectionner les preuves justificatives.
  selectionnerFichiers(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files) {
      return;
    }

    const fichiers = Array.from(input.files);

    const fichiersInvalides = fichiers.filter((fichier) => {
      if (fichier.type.startsWith('video/')) {
        return fichier.size > this.TAILLE_MAX_VIDEO;
      }

      return fichier.size > this.TAILLE_MAX_IMAGE_DOCUMENT;
    });

    if (fichiersInvalides.length > 0) {
      this.notificationService.erreur(
        'Les images et documents sont limités à 100 Mo et les vidéos à 200 Mo.'
      );

      input.value = '';
      this.fichiersSelectionnes = [];

      // Afficher l'erreur obligatoire si le formulaire a été soumis.
      if (this.formulaireSoumis) {
        this.erreursChamps.preuve =
          'Au moins une preuve justificative valide est obligatoire.';
      }

      this.actualiserAffichage();
      return;
    }

    this.fichiersSelectionnes = fichiers;

    if (this.fichiersSelectionnes.length > 0) {
      delete this.erreursChamps.preuve;
    }

    this.messageErreur = '';
    this.actualiserAffichage();
  }

  // Supprimer un fichier sélectionné.
  supprimerFichier(index: number): void {
    if (
      index >= 0 &&
      index < this.fichiersSelectionnes.length
    ) {
      this.fichiersSelectionnes.splice(index, 1);

      if (
        this.formulaireSoumis &&
        this.fichiersSelectionnes.length === 0
      ) {
        this.erreursChamps.preuve =
          'Au moins une preuve justificative est obligatoire.';
      }

      this.actualiserAffichage();
    }
  }

  // Déterminer le type du média.
  private determinerTypeMedia(fichier: File): TypeMedia {
    if (fichier.type.startsWith('image/')) {
      return 'IMAGE' as TypeMedia;
    }

    if (fichier.type.startsWith('video/')) {
      return 'VIDEO' as TypeMedia;
    }

    return 'DOCUMENT' as TypeMedia;
  }

  // Vérifier les champs obligatoires.
  private validerFormulaire(): boolean {
    this.erreursChamps = {};

    const cibleDemande = this.demandeAideId !== null;
    const cibleBeneficiaire = this.beneficiaireId !== null;

    // Une seule cible doit être sélectionnée.
    if (cibleDemande === cibleBeneficiaire) {
      this.erreursChamps.cible =
        'Sélectionnez une demande d’aide ou un bénéficiaire, mais pas les deux.';
    }

    if (!this.dateDistribution) {
      this.erreursChamps.dateDistribution =
        'La date de distribution est obligatoire.';
    }

    if (!this.lieuDistribution.trim()) {
      this.erreursChamps.lieuDistribution =
        'Le lieu de distribution est obligatoire.';
    }

    // Une preuve justificative est obligatoire.
    if (this.fichiersSelectionnes.length === 0) {
      this.erreursChamps.preuve =
        'Au moins une preuve justificative est obligatoire.';
    }

    return Object.keys(this.erreursChamps).length === 0;
  }

  // Enregistrer la distribution.
  enregistrer(): void {
    if (this.enregistrement) {
      return;
    }

    this.formulaireSoumis = true;
    this.messageErreur = '';
    this.messageSucces = '';

    // Les erreurs de validation s'affichent sous les champs.
    if (!this.validerFormulaire()) {
      this.actualiserAffichage();
      return;
    }

    // Vérifier l'identifiant de l'organisation.
    if (this.organisationId === null) {
      this.notificationService.erreur(
        'Impossible de déterminer l’identifiant de votre organisation.'
      );
      return;
    }

    const dto: AideDistribueeRequest = {
      demandeAideId: this.demandeAideId,
      beneficiaireId: this.beneficiaireId,
      dateDistribution: this.dateDistribution,
      lieuDistribution: this.lieuDistribution.trim()
    };

    this.enregistrement = true;
    this.actualiserAffichage();

    this.aideDistribueeService.creer(dto).subscribe({
      next: (aide: any) => {
        const aideId = aide?.id;

        if (aideId === null || aideId === undefined) {
          this.notificationService.erreur(
            'La distribution a été créée, mais son identifiant est absent de la réponse.'
          );

          this.enregistrement = false;
          this.actualiserAffichage();
          return;
        }

        // Envoyer les preuves avant de confirmer le succès.
        this.televerserPreuves(Number(aideId));
      },

      error: (erreur) => {
        console.error('Erreur création distribution :', erreur);

        this.notificationService.erreur(
          erreur?.error?.message ??
          'Une erreur est survenue lors de la création de la distribution.'
        );

        this.enregistrement = false;
        this.actualiserAffichage();
      }
    });
  }

  // Envoyer les preuves une par une.
  private televerserPreuves(aideId: number): void {
    const fichiers = [...this.fichiersSelectionnes];
    let index = 0;

    const televerserSuivant = (): void => {
      if (index >= fichiers.length) {
        this.finaliserEnregistrement();
        return;
      }

      const fichier = fichiers[index++];
      const typeMedia = this.determinerTypeMedia(fichier);

      this.preuveDistributionService
        .ajouter(aideId, fichier, typeMedia)
        .subscribe({
          next: () => {
            televerserSuivant();
          },

          error: (erreur) => {
            console.error(
              `Erreur téléversement de ${fichier.name} :`,
              erreur
            );

            this.notificationService.erreur(
              erreur?.error?.message ??
              `La distribution a été créée, mais la preuve « ${fichier.name} » n’a pas pu être envoyée.`
            );

            this.enregistrement = false;
            this.actualiserAffichage();
          }
        });
    };

    televerserSuivant();
  }

  // Confirmer l'enregistrement et rediriger vers la liste.
  private finaliserEnregistrement(): void {
    this.enregistrement = false;

    this.notificationService.succes(
      'La distribution et ses preuves ont été enregistrées avec succès.'
    );

    this.actualiserAffichage();

    this.router.navigate([
      '/organisation/aide-distribuee'
    ]);
  }

  // Annuler et retourner à la liste.
  annuler(): void {
    this.router.navigate([
      '/organisation/aide-distribuee'
    ]);
  }

  // Actualiser l'affichage du composant.
  private actualiserAffichage(): void {
    this.cdr.detectChanges();
  }
}
