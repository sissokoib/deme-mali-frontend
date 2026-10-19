
import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';

import { DemandeAideRequest } from '../../../../models/demande.model';
import { ArticleDemande } from '../../../../models/articles-demandes.model';
import { CategorieDemande } from '../../../../models/categorie-demande.model';
import { TypeJustificatif } from '../../../../models/type-justificatif.models';

import { demandeAideService } from '../../../../services/demande-aide';
import { CategorieDemandeService } from '../../../../services/categorie-demande';
import { BeneficiaireService } from '../../../../services/beneficiaire';
import { TypeJustificatifService } from '../../../../services/type-justificatif-service';
import { JustificatifService } from '../../../../services/justificatif-service';
import { AuthService } from '../../../../services/auth.service';
import { NotificationService } from '../../../../services/notification';

@Component({
  selector: 'app-add-demandes-aide',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule
  ],
  templateUrl: './add-demandes.html',
  styleUrl: './add-demandes.css'
})
export class AddDemandesAide implements OnInit {

  categories: CategorieDemande[] = [];
  beneficiaires: any[] = [];
  typesJustificatif: TypeJustificatif[] = [];

  fichiers: File[] = [];
  typeJustificatifId: number | null = null;

  chargement = false;
  soumis = false;
  erreurAjoutArticle = false;

  organisationPartenaireId: number | null = null;

  rechercheBeneficiaire = '';
  listeBeneficiairesVisible = false;

  demande: DemandeAideRequest = {
    titre: '',
    descriptionSituation: '',
    niveauUrgence: 'MOYENNE',
    motif: '',
    nombrePersonne: 1,
    montantNecessaire: null,
    beneficiaireId: 0,
    organisationPartenaireId: 0,
    categorieDemandeId: 0,
    typeDemande: 'INDIVIDUEL',
    typeDemandeAide: 'FINANCIERE',
    articles: []
  };

  nouvelArticle: ArticleDemande = {
    designation: '',
    quantiteDemandee: 1,
    unite: 'unité',
    prixUnitaireEstime: 0
  };

  constructor(
    private demandeService: demandeAideService,
    private categorieService: CategorieDemandeService,
    private beneficiaireService: BeneficiaireService,
    private typeJustificatifService: TypeJustificatifService,
    private justificatifService: JustificatifService,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const utilisateur = this.authService.getCurrentUser();

    if (!utilisateur?.id) {
      this.notificationService.erreur(
        'Impossible d’identifier l’organisation connectée.'
      );
      return;
    }

    this.organisationPartenaireId = Number(utilisateur.id);
    this.demande.organisationPartenaireId =
      this.organisationPartenaireId;

    this.chargerCategories();
    this.chargerBeneficiaires();
    this.chargerTypesJustificatif();
  }

  bloquerMoletteMontant(event: WheelEvent): void {
    const input = event.currentTarget;

    if (input instanceof HTMLInputElement) {
      input.blur();
    }
  }

  chargerCategories(): void {
    this.categorieService.getCategories().subscribe({
      next: data => {
        this.categories = data ?? [];
        this.cdr.detectChanges();
      },
      error: error => {
        console.error('Erreur chargement catégories', error);
        this.notificationService.erreur(
          'Impossible de charger les catégories.'
        );
      }
    });
  }

  chargerBeneficiaires(): void {
    if (!this.organisationPartenaireId) {
      return;
    }

    this.beneficiaireService
      .trouverParOrganisation(this.organisationPartenaireId)
      .subscribe({
        next: data => {
          this.beneficiaires = (data ?? []).filter(
            (beneficiaire: any) => {
              const statut = String(
                beneficiaire.statut ?? ''
              ).toUpperCase();

              return !statut || [
                'ACCEPTE',
                'ACCEPTEE',
                'ACCEPTE_PAR_ORGANISATION',
                'ACCEPTEE_PAR_ORGANISATION'
              ].includes(statut);
            }
          );

          this.cdr.detectChanges();

          if (this.beneficiaires.length === 0) {
            this.notificationService.info(
              'Aucun bénéficiaire accepté n’est disponible pour cette organisation.'
            );
          }
        },
        error: error => {
          console.error('Erreur chargement bénéficiaires', error);
          this.notificationService.erreur(
            'Impossible de charger les bénéficiaires.'
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
      error: error => {
        console.error(
          'Erreur chargement types de justificatifs',
          error
        );

        this.notificationService.erreur(
          'Impossible de charger les types de justificatifs.'
        );
      }
    });
  }

  changerTypeDemande(): void {
    if (this.demande.typeDemande === 'INDIVIDUEL') {
      this.demande.nombrePersonne = 1;
      return;
    }

    if (
      !Number.isInteger(Number(this.demande.nombrePersonne)) ||
      Number(this.demande.nombrePersonne) < 2
    ) {
      this.demande.nombrePersonne = 2;
    }
  }

  nombrePersonnesInvalide(): boolean {
    const nombre = Number(this.demande.nombrePersonne);

    if (this.demande.typeDemande === 'INDIVIDUEL') {
      return nombre !== 1;
    }

    return !Number.isInteger(nombre) || nombre < 2;
  }

  get beneficiairesFiltres(): any[] {
    const recherche = this.rechercheBeneficiaire
      .trim()
      .toLowerCase();

    if (!recherche) {
      return this.beneficiaires;
    }

    return this.beneficiaires.filter((b: any) => {
      const nom = String(b.nom ?? '').toLowerCase();
      const prenom = String(b.prenom ?? '').toLowerCase();
      const id = String(b.id ?? '').toLowerCase();
      const telephone = String(b.telephone ?? '').toLowerCase();
      const nomComplet = `${prenom} ${nom}`.toLowerCase();

      return (
        nom.includes(recherche) ||
        prenom.includes(recherche) ||
        id.includes(recherche) ||
        telephone.includes(recherche) ||
        nomComplet.includes(recherche)
      );
    });
  }

  nomCompletBeneficiaire(b: any): string {
    const nomComplet =
      `${b.prenom ?? ''} ${b.nom ?? ''}`.trim();

    return nomComplet || `Bénéficiaire #${b.id}`;
  }

  ouvrirListeBeneficiaires(): void {
    this.listeBeneficiairesVisible = true;
  }

  selectionnerBeneficiaire(b: any): void {
    this.demande.beneficiaireId = Number(b.id);
    this.rechercheBeneficiaire = this.nomCompletBeneficiaire(b);
    this.listeBeneficiairesVisible = false;
  }

  effacerBeneficiaire(): void {
    this.demande.beneficiaireId = 0;
    this.rechercheBeneficiaire = '';
    this.listeBeneficiairesVisible = true;
  }

  get montantMateriel(): number {
    return (this.demande.articles ?? []).reduce(
      (total, article) =>
        total +
        Number(article.quantiteDemandee || 0) *
        Number(article.prixUnitaireEstime || 0),
      0
    );
  }

  get montantEstime(): number {
    return this.demande.typeDemandeAide === 'FINANCIERE'
      ? Number(this.demande.montantNecessaire || 0)
      : this.montantMateriel;
  }

  prixArticleEstVide(): boolean {
    const prix: unknown = this.nouvelArticle.prixUnitaireEstime;

    return (
      prix === null ||
      prix === undefined ||
      String(prix).trim() === ''
    );
  }

  prixArticleInvalide(): boolean {
    if (this.prixArticleEstVide()) {
      return false;
    }

    const prix = Number(this.nouvelArticle.prixUnitaireEstime);

    return !Number.isFinite(prix) || prix <= 0;
  }

  designationArticleInvalide(): boolean {
    return !this.nouvelArticle.designation?.trim();
  }

  quantiteArticleInvalide(): boolean {
    const quantite = Number(this.nouvelArticle.quantiteDemandee);

    return !Number.isInteger(quantite) || quantite <= 0;
  }

  uniteArticleInvalide(): boolean {
    return !this.nouvelArticle.unite?.trim();
  }

  ajouterArticle(): void {
    this.erreurAjoutArticle = true;

    const designation =
      this.nouvelArticle.designation?.trim() ?? '';
    const quantite =
      Number(this.nouvelArticle.quantiteDemandee);
    const unite =
      this.nouvelArticle.unite?.trim() ?? '';
    const prix = Number(this.nouvelArticle.prixUnitaireEstime);

    // Les erreurs sont affichées dans le formulaire, sans notification.
    if (
      !designation ||
      !Number.isInteger(quantite) ||
      quantite <= 0 ||
      !unite ||
      this.prixArticleEstVide() ||
      !Number.isFinite(prix) ||
      prix <= 0
    ) {
      return;
    }

    const article: ArticleDemande = {
      designation,
      quantiteDemandee: quantite,
      unite,
      prixUnitaireEstime: prix
    };

    const existant = this.demande.articles.find(
      a =>
        a.designation.trim().toLowerCase() ===
          designation.toLowerCase() &&
        a.unite.trim().toLowerCase() ===
          unite.toLowerCase() &&
        Number(a.prixUnitaireEstime) === prix
    );

    if (existant) {
      existant.quantiteDemandee += quantite;
    } else {
      this.demande.articles.push(article);
    }

    this.erreurAjoutArticle = false;

    this.nouvelArticle = {
      designation: '',
      quantiteDemandee: 1,
      unite: 'unité',
      prixUnitaireEstime: 0
    };

    this.notificationService.succes(
      'Article ajouté avec succès.'
    );
  }

  supprimerArticle(index: number): void {
    if (
      index < 0 ||
      index >= this.demande.articles.length
    ) {
      return;
    }

    this.demande.articles.splice(index, 1);
    this.notificationService.info('Article retiré.');
  }

  changerTypeAide(): void {
    this.erreurAjoutArticle = false;

    if (this.demande.typeDemandeAide === 'FINANCIERE') {
      this.demande.articles = [];
    } else {
      this.demande.montantNecessaire = null;
    }

    this.nouvelArticle = {
      designation: '',
      quantiteDemandee: 1,
      unite: 'unité',
      prixUnitaireEstime: 0
    };
  }

  selectionnerFichiers(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.fichiers = input.files
      ? Array.from(input.files)
      : [];

    // Le type de justificatif n'est exigé que si des fichiers sont joints.
    if (this.fichiers.length === 0) {
      this.typeJustificatifId = null;
    }
  }

  retirerFichier(index: number): void {
    if (
      index < 0 ||
      index >= this.fichiers.length
    ) {
      return;
    }

    this.fichiers.splice(index, 1);

    if (this.fichiers.length === 0) {
      this.typeJustificatifId = null;
    }
  }

  annuler(): void {
    this.router.navigate(['/organisation/demandes-aide']);
  }

  soumettre(form: NgForm): void {
    if (this.chargement) {
      return;
    }

    this.soumis = true;
    form.control.markAllAsTouched();

    // Champs Angular invalides : leurs erreurs apparaissent dans le HTML.
    if (form.invalid) {
      return;
    }

    // Validations personnalisées : les messages sont dans le HTML.
    if (
      !this.demande.categorieDemandeId ||
      !this.demande.beneficiaireId ||
      this.nombrePersonnesInvalide()
    ) {
      return;
    }

    if (!this.organisationPartenaireId) {
      this.notificationService.erreur(
        'Organisation connectée introuvable.'
      );
      return;
    }

    const beneficiaireValide = this.beneficiaires.some(
      (b: any) =>
        Number(b.id) === Number(this.demande.beneficiaireId)
    );

    if (!beneficiaireValide) {
      return;
    }

    if (
      this.demande.typeDemandeAide !== 'FINANCIERE' &&
      this.demande.typeDemandeAide !== 'MATERIELLE'
    ) {
      return;
    }

    if (this.demande.typeDemandeAide === 'FINANCIERE') {
      const montant = Number(this.demande.montantNecessaire);

      if (
        this.demande.montantNecessaire == null ||
        !Number.isFinite(montant) ||
        montant <= 0
      ) {
        return;
      }
    }

    if (this.demande.typeDemandeAide === 'MATERIELLE') {
      if (this.demande.articles.length === 0) {
        return;
      }

      const articlesInvalides = this.demande.articles.some(
        article =>
          !article.designation?.trim() ||
          !article.unite?.trim() ||
          !Number.isInteger(Number(article.quantiteDemandee)) ||
          Number(article.quantiteDemandee) <= 0 ||
          article.prixUnitaireEstime == null ||
          !Number.isFinite(Number(article.prixUnitaireEstime)) ||
          Number(article.prixUnitaireEstime) <= 0
      );

      if (
        articlesInvalides ||
        !Number.isFinite(this.montantMateriel) ||
        this.montantMateriel <= 0
      ) {
        return;
      }
    }

    // Erreur affichée sous le champ de type de justificatif.
    if (this.fichiers.length > 0 && !this.typeJustificatifId) {
      return;
    }

    if (this.demande.typeDemande === 'INDIVIDUEL') {
      this.demande.nombrePersonne = 1;
    }

    // Le champ motif n'est volontairement pas envoyé.
    const payload: DemandeAideRequest = {
      titre: this.demande.titre.trim(),
      descriptionSituation:
        this.demande.descriptionSituation.trim(),
      niveauUrgence: this.demande.niveauUrgence,
      nombrePersonne: Number(this.demande.nombrePersonne),
      beneficiaireId: Number(this.demande.beneficiaireId),
      categorieDemandeId: Number(this.demande.categorieDemandeId),
      organisationPartenaireId: this.organisationPartenaireId,
      typeDemande: this.demande.typeDemande,
      typeDemandeAide: this.demande.typeDemandeAide,
      montantNecessaire:
        this.demande.typeDemandeAide === 'FINANCIERE'
          ? Number(this.demande.montantNecessaire)
          : this.montantMateriel,
      articles:
        this.demande.typeDemandeAide === 'MATERIELLE'
          ? this.demande.articles.map(article => ({
              designation: article.designation.trim(),
              quantiteDemandee: Number(article.quantiteDemandee),
              unite: article.unite.trim(),
              prixUnitaireEstime: Number(article.prixUnitaireEstime)
            }))
          : []
    };

    this.chargement = true;

    this.demandeService
      .creerDemande(payload)
      .pipe(
        finalize(() => {
          this.chargement = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response: any) => {
          const demandeId = Number(response?.id);

          if (this.fichiers.length === 0) {
            this.notificationService.succes(
              'La demande a été créée avec succès.'
            );

            this.router.navigate([
              '/organisation/demandes-aide'
            ]);
            return;
          }

          if (
            !Number.isInteger(demandeId) ||
            demandeId <= 0 ||
            !this.typeJustificatifId
          ) {
            this.notificationService.erreur(
              'La demande a été créée, mais les informations nécessaires à l’envoi des justificatifs sont absentes.'
            );
            return;
          }

          this.justificatifService
            .creerJustificatifs(
              this.fichiers,
              this.typeJustificatifId,
              demandeId
            )
            .subscribe({
              next: () => {
                this.notificationService.succes(
                  'La demande et les justificatifs ont été enregistrés.'
                );

                this.router.navigate([
                  '/organisation/demandes-aide'
                ]);
              },
              error: error => {
                console.error(
                  'Erreur envoi justificatifs',
                  error
                );

                this.notificationService.erreur(
                  'La demande a été créée, mais l’envoi des justificatifs a échoué.'
                );
              }
            });
        },
        error: error => {
          console.error('Erreur création demande', error);

          this.notificationService.erreur(
            error?.error?.message ||
            'Une erreur est survenue lors de la création de la demande.'
          );
        }
      });
  }
  
montantFinancierInvalide(): boolean {
  const valeur = this.demande.montantNecessaire;

  if (
    valeur === null ||
    valeur === undefined ||
    String(valeur).trim() === ''
  ) {
    return true;
  }

  const montant = Number(valeur);

  return !Number.isFinite(montant) || montant <= 0;
}

}
