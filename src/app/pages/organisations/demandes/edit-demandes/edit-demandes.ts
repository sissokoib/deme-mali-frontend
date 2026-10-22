import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';

import {
  Demande,
  DemandeAideRequest
} from '../../../../models/demande.model';

import { ArticleDemande } from '../../../../models/articles-demandes.model';
import { CategorieDemande } from '../../../../models/categorie-demande.model';

import { demandeAideService } from '../../../../services/demande-aide';
import { CategorieDemandeService } from '../../../../services/categorie-demande';
import { BeneficiaireService } from '../../../../services/beneficiaire';
import { AuthService } from '../../../../services/auth.service';
import { NotificationService } from '../../../../services/notification';
import { TypeJustificatifService } from '../../../../services/type-justificatif-service';
import { JustificatifService } from '../../../../services/justificatif-service';
import { MatIconModule } from '@angular/material/icon';

interface FichierJustificatif {
  id: number;
  nomFichier?: string;
  nom?: string;
  url?: string;
  cheminFichier?: string;
  typeJustificatifId?: number;
  typeJustificatifNom?: string;
  typeJustificatif?: {
    id?: number;
    nom?: string;
    libelle?: string;
  };
}

@Component({
  selector: 'app-modifier-demandes-aide',
  standalone: true,
  imports: [CommonModule, FormsModule,MatIconModule],
  templateUrl: './edit-demandes.html',
  styleUrl: './edit-demandes.css'
})
export class ModifierDemandesAide implements OnInit {

  demandeId = 0;
  demande: Demande | null = null;

  categories: CategorieDemande[] = [];
  beneficiaires: any[] = [];
  typesJustificatif: any[] = [];

  chargement = true;
  enregistrement = false;

  fichiersExistants: FichierJustificatif[] = [];
  fichiersAjoutes: File[] = [];
  fichiersASupprimer: number[] = [];

  // Prévisualisation des images justificatives.
  imageApercu = '';
  nomImageApercu = '';

  typeJustificatifId: number | null = null;
  montantInitial: number | null = null;

  nouvelArticle: ArticleDemande = {
    designation: '',
    quantiteDemandee: 1,
    unite: 'unité',
    prixUnitaireEstime: 0
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private demandeService: demandeAideService,
    private categorieService: CategorieDemandeService,
    private beneficiaireService: BeneficiaireService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private typeJustificatifService: TypeJustificatifService,
    private justificatifService: JustificatifService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.demandeId = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isInteger(this.demandeId) || this.demandeId <= 0) {
      this.notificationService.erreur(
        'Identifiant de demande invalide.'
      );
      this.chargement = false;
      return;
    }

    this.chargerCategories();
    this.chargerTypesJustificatif();
    this.chargerDemande();
  }

  get estModifiable(): boolean {
    return this.demande?.statut === 'EN_ATTENTE';
  }

  get montantMateriel(): number {
    return (this.demande?.articles ?? []).reduce(
      (total, article) =>
        total +
        Number(article.quantiteDemandee || 0) *
        Number(article.prixUnitaireEstime || 0),
      0
    );
  }

  get montantEstime(): number {
    if (!this.demande) {
      return 0;
    }

    return this.demande.typeDemandeAide === 'FINANCIERE'
      ? Number(this.demande.montantNecessaire || 0)
      : this.montantMateriel;
  }

  get variationMontant(): number {
    if (
      !this.demande ||
      this.montantInitial === null ||
      this.demande.typeDemandeAide !== 'FINANCIERE'
    ) {
      return 0;
    }

    return (
      Number(this.demande.montantNecessaire || 0) -
      this.montantInitial
    );
  }

  // --------------------------------------------------
  // Chargement des données
  // --------------------------------------------------

  chargerCategories(): void {
    this.categorieService.getCategories().subscribe({
      next: data => {
        this.categories = data ?? [];
        this.cdr.detectChanges();
      },
      error: err => {
        console.error(err);
        this.notificationService.erreur(
          'Impossible de charger les catégories.'
        );
      }
    });
  }

  chargerTypesJustificatif(): void {
    this.typeJustificatifService.getTypes().subscribe({
      next: data => {
        this.typesJustificatif = data ?? [];
        this.cdr.detectChanges();
      },
      error: err => {
        console.error(err);
        this.notificationService.erreur(
          'Impossible de charger les types de justificatifs.'
        );
      }
    });
  }

  chargerDemande(): void {
  this.chargement = true;

  this.demandeService
    .getDemandeById(this.demandeId)
    .pipe(
      finalize(() => {
        this.chargement = false;
        this.cdr.detectChanges();
      })
    )
    .subscribe({
      next: (data) => {
        console.log('Demande récupérée :', data);

        this.demande = {
          ...data,
          articles: (data.articles ?? []).map(article => ({
            ...article
          }))
        };

        this.montantInitial =
          data.typeDemandeAide === 'FINANCIERE'
            ? Number(data.montantNecessaire || 0)
            : null;

        const utilisateur = this.authService.getCurrentUser();

        if (
          !utilisateur?.id ||
          Number(this.demande.organisationPartenaireId) !==
            Number(utilisateur.id)
        ) {
          this.notificationService.erreur(
            'Cette demande ne dépend pas de votre organisation.'
          );

          this.demande = null;
          return;
        }

        if (!this.estModifiable) {
          this.notificationService.info(
            'Seules les demandes en attente peuvent être modifiées.'
          );
        }

        this.chargerBeneficiaires();
        this.chargerJustificatifs();
      },

      error: (err) => {
        console.error(
          'Erreur lors du chargement de la demande :',
          err
        );

        this.notificationService.erreur(
          err?.error?.message ||
          'Impossible de charger la demande. Vérifie le backend et l’identifiant.'
        );
      }
    });
}

  chargerBeneficiaires(): void {
    const organisationId = this.demande?.organisationPartenaireId;

    if (!organisationId) {
      return;
    }

    this.beneficiaireService
      .trouverParOrganisation(organisationId)
      .subscribe({
        next: data => {
          this.beneficiaires = data ?? [];
          this.cdr.detectChanges();
        },
        error: err => {
          console.error(err);
          this.notificationService.erreur(
            'Impossible de charger les bénéficiaires.'
          );
        }
      });
  }

  chargerJustificatifs(): void {
    this.justificatifService
      .getByDemande(this.demandeId)
      .subscribe({
        next: data => {
          this.fichiersExistants =
            (data ?? []) as FichierJustificatif[];

          const premierFichier = this.fichiersExistants[0];

          if (premierFichier) {
            const typeId =
              premierFichier.typeJustificatifId ??
              premierFichier.typeJustificatif?.id;

            if (typeId != null) {
              this.typeJustificatifId = Number(typeId);
            }
          }

          this.cdr.detectChanges();
        },
        error: err => {
          console.error('Chargement des justificatifs :', err);
          this.fichiersExistants = [];
          this.cdr.detectChanges();
        }
      });
  }

  // --------------------------------------------------
  // Justificatifs et prévisualisation des images
  // --------------------------------------------------

  nomFichier(fichier: FichierJustificatif): string {
    return (
      fichier.nomFichier ??
      fichier.nom ??
      `Justificatif #${fichier.id}`
    );
  }

  nomTypeFichier(fichier: FichierJustificatif): string {
    return (
      fichier.typeJustificatifNom ??
      fichier.typeJustificatif?.nom ??
      fichier.typeJustificatif?.libelle ??
      'Type non renseigné'
    );
  }

  urlFichier(fichier: FichierJustificatif): string {
    const chemin =
      fichier.url || fichier.cheminFichier || '';

    if (!chemin) {
      return '';
    }

    if (
      chemin.startsWith('http://') ||
      chemin.startsWith('https://')
    ) {
      return chemin;
    }

    return `http://localhost:8080/${chemin.replace(/^\/+/, '')}`;
  }

  // Détecter les formats d'image pris en charge.
  estUneImage(chemin: string | null): boolean {
    return !!chemin &&
      /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(chemin);
  }

  // Afficher l'image dans la fenêtre de prévisualisation.
  ouvrirApercuImage(fichier: FichierJustificatif): void {
    const url = this.urlFichier(fichier);

    if (!url || !this.estUneImage(url)) {
      return;
    }

    this.imageApercu = url;
    this.nomImageApercu = this.nomFichier(fichier);
  }

  // Fermer la prévisualisation.
  fermerApercuImage(): void {
    this.imageApercu = '';
    this.nomImageApercu = '';
  }

  fichierMarque(fichier: FichierJustificatif): boolean {
    return this.fichiersASupprimer.includes(fichier.id);
  }

  basculerSuppressionFichier(
    fichier: FichierJustificatif
  ): void {
    if (!fichier?.id || this.enregistrement) {
      return;
    }

    if (!this.fichiersASupprimer.includes(fichier.id)) {
      this.fichiersASupprimer = [
        ...this.fichiersASupprimer,
        fichier.id
      ];
    }

    this.fichiersExistants = this.fichiersExistants.filter(
      element => element.id !== fichier.id
    );

    this.cdr.detectChanges();
  }

  selectionnerFichiers(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files?.length) {
      return;
    }

    this.fichiersAjoutes = [
      ...this.fichiersAjoutes,
      ...Array.from(input.files)
    ];

    input.value = '';
  }

  retirerNouveauFichier(index: number): void {
    if (index < 0 || index >= this.fichiersAjoutes.length) {
      return;
    }

    this.fichiersAjoutes = this.fichiersAjoutes.filter(
      (_, i) => i !== index
    );
  }

  bloquerMoletteMontant(event: WheelEvent): void {
    const cible = event.currentTarget;

    if (cible instanceof HTMLInputElement) {
      cible.blur();
    }
  }

  // --------------------------------------------------
  // Gestion des articles matériels
  // --------------------------------------------------

  ajouterArticle(): void {
    if (!this.demande || this.enregistrement) {
      return;
    }

    const designation =
      (this.nouvelArticle.designation ?? '').trim();

    const quantite =
      Number(this.nouvelArticle.quantiteDemandee);

    const prix =
      Number(this.nouvelArticle.prixUnitaireEstime);

    const unite =
      (this.nouvelArticle.unite ?? '').trim() || 'unité';

    if (
      !designation ||
      !Number.isInteger(quantite) ||
      quantite <= 0 ||
      !Number.isFinite(prix) ||
      prix < 0
    ) {
      this.notificationService.erreur(
        'Saisis une désignation, une quantité positive et un prix valide.'
      );
      return;
    }

    this.demande.articles ??= [];

    const normaliser = (texte: string): string =>
      texte
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .toLowerCase();

    const articleExistant = this.demande.articles.find(
      article =>
        normaliser(article.designation) === normaliser(designation) &&
        normaliser(article.unite ?? 'unité') === normaliser(unite)
    );

    if (articleExistant) {
      if (
        Number(articleExistant.prixUnitaireEstime) !== prix
      ) {
        this.notificationService.erreur(
          'Cet article existe déjà avec un prix différent.'
        );
        return;
      }

      articleExistant.quantiteDemandee =
        Number(articleExistant.quantiteDemandee) + quantite;
    } else {
      this.demande.articles.push({
        designation,
        quantiteDemandee: quantite,
        unite,
        prixUnitaireEstime: prix
      });
    }

    this.nouvelArticle = {
      designation: '',
      quantiteDemandee: 1,
      unite: 'unité',
      prixUnitaireEstime: 0
    };
  }

  supprimerArticle(index: number): void {
    if (
      !this.demande?.articles ||
      index < 0 ||
      index >= this.demande.articles.length
    ) {
      return;
    }

    this.demande.articles.splice(index, 1);
  }

  // --------------------------------------------------
  // Validation
  // --------------------------------------------------

  private validerDonnees(): boolean {
    const d = this.demande;

    if (!d) {
      return false;
    }

    if (!String(d.titre ?? '').trim()) {
      this.notificationService.erreur(
        'Le titre ne peut pas être vide.'
      );
      return false;
    }

    if (
      !Number.isInteger(Number(d.nombrePersonne)) ||
      Number(d.nombrePersonne) < 1
    ) {
      this.notificationService.erreur(
        'Le nombre de personnes doit être un entier positif.'
      );
      return false;
    }

    if (
      !this.beneficiaires.some(
        beneficiaire =>
          Number(beneficiaire.id) === Number(d.beneficiaireId)
      )
    ) {
      this.notificationService.erreur(
        'Choisis un bénéficiaire de ton organisation.'
      );
      return false;
    }

    if (
      d.typeDemandeAide === 'FINANCIERE' &&
      (
        !Number.isFinite(Number(d.montantNecessaire)) ||
        Number(d.montantNecessaire) <= 0
      )
    ) {
      this.notificationService.erreur(
        'Le montant doit être supérieur à zéro.'
      );
      return false;
    }

    if (d.typeDemandeAide === 'MATERIELLE') {
      if (!d.articles?.length) {
        this.notificationService.erreur(
          'Une demande matérielle doit contenir au moins un article.'
        );
        return false;
      }

      const articleInvalide = d.articles.some(article =>
        !String(article.designation ?? '').trim() ||
        !Number.isInteger(Number(article.quantiteDemandee)) ||
        Number(article.quantiteDemandee) <= 0 ||
        !Number.isFinite(Number(article.prixUnitaireEstime)) ||
        Number(article.prixUnitaireEstime) < 0
      );

      if (articleInvalide) {
        this.notificationService.erreur(
          'Vérifie les désignations, quantités et prix des articles.'
        );
        return false;
      }
    }

    if (
      this.fichiersAjoutes.length > 0 &&
      !this.typeJustificatifId
    ) {
      this.notificationService.erreur(
        'Choisis un type de justificatif avant d’ajouter des fichiers.'
      );
      return false;
    }

    return true;
  }

  // --------------------------------------------------
  // Enregistrement de la demande et des justificatifs
  // --------------------------------------------------

  enregistrer(_form: NgForm): void {
    if (
      !this.demande ||
      !this.estModifiable ||
      this.enregistrement
    ) {
      this.notificationService.erreur(
        'Cette demande ne peut pas être modifiée.'
      );
      return;
    }

    if (!this.validerDonnees()) {
      return;
    }

    const d = this.demande;

    const payload: DemandeAideRequest = {
      titre: String(d.titre ?? '').trim(),
      descriptionSituation:
        String(d.descriptionSituation ?? '').trim(),
      niveauUrgence:
        d.niveauUrgence as 'FORTE' | 'MOYENNE' | 'FAIBLE',
      motif: String(d.motif ?? '').trim(),
      nombrePersonne: Number(d.nombrePersonne),
      montantNecessaire:
        d.typeDemandeAide === 'FINANCIERE'
          ? Number(d.montantNecessaire)
          : null,
      beneficiaireId: Number(d.beneficiaireId),
      organisationPartenaireId:
        Number(d.organisationPartenaireId),
      categorieDemandeId: Number(d.categorieDemandeId),
      typeDemande:
        d.typeDemande as 'INDIVIDUEL' | 'COLLECTIF',
      typeDemandeAide: d.typeDemandeAide,
      articles:
        d.typeDemandeAide === 'MATERIELLE'
          ? (d.articles ?? []).map(article => ({
              designation:
                String(article.designation ?? '').trim(),
              quantiteDemandee:
                Number(article.quantiteDemandee),
              unite:
                String(article.unite ?? 'unité').trim() || 'unité',
              prixUnitaireEstime:
                Number(article.prixUnitaireEstime)
            }))
          : []
    };

    console.log('Articles du formulaire :', d.articles);
    console.log('Articles envoyés au backend :', payload.articles);

    this.enregistrement = true;

    this.demandeService
      .modifierDemande(this.demandeId, payload)
      .subscribe({
        next: () => {
          this.enregistrerFichiers();
        },
        error: err => {
          console.error(err);

          this.enregistrement = false;
          this.cdr.detectChanges();

          this.notificationService.erreur(
            err?.error?.message ||
            'La modification de la demande a échoué.'
          );
        }
      });
  }

  private enregistrerFichiers(): void {
    const operations = [];

    for (const id of this.fichiersASupprimer) {
      operations.push(
        this.justificatifService.supprimer(id)
      );
    }

    if (this.fichiersAjoutes.length > 0) {
      if (!this.typeJustificatifId) {
        this.enregistrement = false;
        this.cdr.detectChanges();

        this.notificationService.erreur(
          'Choisis un type de justificatif avant d’ajouter des fichiers.'
        );
        return;
      }

      operations.push(
        this.justificatifService.creerJustificatifs(
          this.fichiersAjoutes,
          this.typeJustificatifId,
          this.demandeId
        )
      );
    }

    if (operations.length === 0) {
      this.enregistrement = false;

      this.notificationService.succes(
        'La demande a été modifiée avec succès.'
      );

      this.router.navigate(['/organisation/demandes-aide']);
      return;
    }

    forkJoin(operations)
      .pipe(
        finalize(() => {
          this.enregistrement = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.fichiersASupprimer = [];
          this.fichiersAjoutes = [];

          this.notificationService.succes(
            'La demande et les justificatifs ont été modifiés avec succès.'
          );

          this.router.navigate(['/organisation/demandes-aide']);
        },
        error: err => {
          console.error(
            'Erreur lors de la modification des justificatifs :',
            err
          );

          this.notificationService.erreur(
            'La demande a été enregistrée, mais une opération sur les justificatifs a échoué. Vérifie les fichiers avant de recommencer.'
          );
        }
      });
  }

  annuler(): void {
    this.router.navigate(['/organisation/demandes-aide']);
  }
  imageErreur(event: Event): void {
  const image = event.target as HTMLImageElement;

  console.error(
    'Impossible de charger cette image :',
    image.src
  );

  image.style.display = 'none';
}
}