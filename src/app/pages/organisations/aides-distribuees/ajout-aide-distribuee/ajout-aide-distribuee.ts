
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

import { Demande } from '../../../../models/demande.model';
import { Beneficiaire } from '../../../../models/beneficiaire.model';
import { AideDistribueeRequest } from '../../../../models/aide-distribuee.model';
import { TypeMedia } from '../../../../models/preuve-distribution.model';

@Component({
  selector: 'app-ajout-aide-distribuee',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  messageErreur = '';
  messageSucces = '';

  formulaireSoumis = false;

  erreursChamps: {
    cible?: string;
    dateDistribution?: string;
    lieuDistribution?: string;
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
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.recupererOrganisation();
  }

  recupererOrganisation(): void {
    const utilisateur = this.authService.getCurrentUser() as any;

    if (!utilisateur) {
      this.messageErreur = 'Aucun utilisateur connecté.';
      this.actualiserAffichage();
      return;
    }

    if (utilisateur.role !== 'ORGANISATIONPARTENAIRE') {
      this.messageErreur =
        'Cette page est réservée aux organisations partenaires.';
      this.actualiserAffichage();
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
      this.messageErreur =
        'Impossible de déterminer l’identifiant de votre organisation.';
      this.actualiserAffichage();
      return;
    }

    this.organisationId = organisationId;
    this.messageErreur = '';

    this.chargerDemandes();
    this.chargerBeneficiaires();

    this.actualiserAffichage();
  }

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
          this.messageErreur =
            'Impossible de charger les demandes éligibles.';

          this.actualiserAffichage();
        }
      });
  }

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
          console.error('Erreur chargement bénéficiaires :', erreur);

          this.beneficiaires = [];
          this.chargementBeneficiaires = false;
          this.messageErreur =
            'Impossible de charger les bénéficiaires acceptés.';

          this.actualiserAffichage();
        }
      });
  }

  selectionnerDemande(valeur: string | number | null): void {
    this.demandeAideId =
      valeur === '' || valeur === null ? null : Number(valeur);

    if (this.demandeAideId !== null) {
      this.beneficiaireId = null;
    }

    this.effacerErreurCible();
    this.actualiserAffichage();
  }

  selectionnerBeneficiaire(valeur: string | number | null): void {
    this.beneficiaireId =
      valeur === '' || valeur === null ? null : Number(valeur);

    if (this.beneficiaireId !== null) {
      this.demandeAideId = null;
    }

    this.effacerErreurCible();
    this.actualiserAffichage();
  }

  private effacerErreurCible(): void {
    if (
      this.demandeAideId !== null ||
      this.beneficiaireId !== null
    ) {
      delete this.erreursChamps.cible;
    }
  }

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
      this.messageErreur =
        'Les images et documents sont limités à 100 Mo et les vidéos à 200 Mo.';

      input.value = '';
      this.fichiersSelectionnes = [];

      this.actualiserAffichage();
      return;
    }

    this.fichiersSelectionnes = fichiers;
    this.messageErreur = '';

    this.actualiserAffichage();
  }

  supprimerFichier(index: number): void {
    if (
      index >= 0 &&
      index < this.fichiersSelectionnes.length
    ) {
      this.fichiersSelectionnes.splice(index, 1);
      this.actualiserAffichage();
    }
  }

  private determinerTypeMedia(fichier: File): TypeMedia {
    if (fichier.type.startsWith('image/')) {
      return 'IMAGE' as TypeMedia;
    }

    if (fichier.type.startsWith('video/')) {
      return 'VIDEO' as TypeMedia;
    }

    return 'DOCUMENT' as TypeMedia;
  }

  private validerFormulaire(): boolean {
    this.erreursChamps = {};

    const cibleDemande = this.demandeAideId !== null;
    const cibleBeneficiaire = this.beneficiaireId !== null;

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

    return Object.keys(this.erreursChamps).length === 0;
  }

  enregistrer(): void {
    if (this.enregistrement) {
      return;
    }

    this.formulaireSoumis = true;
    this.messageErreur = '';
    this.messageSucces = '';

    // Vérifier d'abord les champs obligatoires.
    const formulaireValide = this.validerFormulaire();

    if (!formulaireValide) {
      this.actualiserAffichage();
      return;
    }

    // Vérifier ensuite la présence des preuves.
    if (this.fichiersSelectionnes.length === 0) {
      this.messageErreur =
        'Ajoutez au moins une preuve justificative avant d’enregistrer la distribution.';
      this.actualiserAffichage();
      return;
    }

    // Vérifier l'identifiant de l'organisation.
    if (this.organisationId === null) {
      this.messageErreur =
        'Impossible de déterminer l’identifiant de votre organisation.';
      this.actualiserAffichage();
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
          this.messageErreur =
            'La distribution a été créée, mais son identifiant est absent de la réponse.';

          this.enregistrement = false;
          this.actualiserAffichage();
          return;
        }

        this.televerserPreuves(Number(aideId));
      },
      error: (erreur) => {
        console.error('Erreur création distribution :', erreur);

        this.messageErreur =
          erreur?.error?.message ??
          'Une erreur est survenue lors de la création de la distribution.';

        this.enregistrement = false;
        this.actualiserAffichage();
      }
    });
  }

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

            this.messageErreur =
              erreur?.error?.message ??
              `La distribution a été créée, mais la preuve « ${fichier.name} » n’a pas pu être envoyée.`;

            this.enregistrement = false;
            this.actualiserAffichage();
          }
        });
    };

    televerserSuivant();
  }

  private finaliserEnregistrement(): void {
    this.messageErreur = '';
    this.messageSucces =
      'La distribution et ses preuves ont été enregistrées avec succès.';

    this.enregistrement = false;
    this.actualiserAffichage();

    // Le succès reste affiché dans le formulaire.
  }

  annuler(): void {
    this.router.navigate(['/organisation/aide-distribuee']);
  }

  private actualiserAffichage(): void {
    this.cdr.detectChanges();
  }
}
