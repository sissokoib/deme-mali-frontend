import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { Demande } from '../../../../models/demande.model';
import { CategorieDemande } from '../../../../models/categorie-demande.model';

import { demandeAideService } from '../../../../services/demande-aide';
import { CategorieDemandeService } from '../../../../services/categorie-demande';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-list-demandes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule
  ],
  templateUrl: './list-demandes.html',
  styleUrl: './list-demandes.css'
})
export class ListDemandes implements OnInit {

  // Toutes les demandes récupérées depuis le backend
  demandes: Demande[] = [];

  // Demandes après application des filtres
  demandesFiltrees: Demande[] = [];

  // Catégories disponibles
  categories: CategorieDemande[] = [];

  // Valeurs des filtres
  recherche = '';
  categorieSelectionnee = '';
  urgenceSelectionnee = '';
  statutSelectionne = '';
  typeAideSelectionne = '';

  // Statistiques
  totalDemandes = 0;
  demandesRefusees = 0;
  demandesAttente = 0;
  demandesTraitees = 0;

  // Pagination
  demandesParPage = 5;
  pageActuelle = 1;
  pages: number[] = [];
  nombrePages = 1;

  constructor(
    private demandeAideService: demandeAideService,
    private categorieDemandeService: CategorieDemandeService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.chargerDemandes();
    this.chargerCategories();
  }

  // Charger les catégories depuis le service dédié
  chargerCategories(): void {
    this.categorieDemandeService.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error(
          'Erreur lors du chargement des catégories',
          error
        );
      }
    });
  }

  // Charger les demandes de l'organisation connectée
  chargerDemandes(): void {
    const utilisateur = this.authService.getCurrentUser();

    if (!utilisateur?.id) {
      console.error(
        'Aucun utilisateur connecté ou identifiant absent'
      );
      return;
    }

    this.demandeAideService
      .getDemandesParOrganisation(utilisateur.id)
      .subscribe({
        next: (data) => {
          // Trier les demandes de la plus récente à la plus ancienne
          this.demandes = [...data].sort(
            (a, b) =>
              new Date(b.dateCreation).getTime() -
              new Date(a.dateCreation).getTime()
          );

          this.calculerStatistiques();
          this.filtrer();
          this.cdr.detectChanges();
        },

        error: (error) => {
          console.error(
            'Erreur lors du chargement des demandes',
            error
          );
        }
      });
  }

  // Calculer les statistiques
  calculerStatistiques(): void {
    this.totalDemandes = this.demandes.length;

    this.demandesRefusees = this.demandes.filter(
      demande => demande.statut === 'REJETEE'
    ).length;

    this.demandesAttente = this.demandes.filter(
      demande => demande.statut === 'EN_ATTENTE'
    ).length;

    this.demandesTraitees = this.demandes.filter(
      demande => demande.statut === 'VALIDEE'
    ).length;
  }

  // Filtrer les demandes
  filtrer(): void {
    const rechercheTexte = this.recherche.trim().toLowerCase();

    this.demandesFiltrees = this.demandes.filter(demande => {
      const titre = demande.titre?.toLowerCase() ?? '';
      const nom = demande.beneficiaireNom?.toLowerCase() ?? '';
      const prenom = demande.beneficiairePrenom?.toLowerCase() ?? '';

      const correspondRecherche =
        titre.includes(rechercheTexte) ||
        nom.includes(rechercheTexte) ||
        prenom.includes(rechercheTexte);

      const correspondCategorie =
        !this.categorieSelectionnee ||
        String(demande.categorieDemandeId) ===
          this.categorieSelectionnee;

      const correspondUrgence =
        !this.urgenceSelectionnee ||
        demande.niveauUrgence === this.urgenceSelectionnee;

      const correspondStatut =
        !this.statutSelectionne ||
        demande.statut === this.statutSelectionne;

      const correspondTypeAide =
        !this.typeAideSelectionne ||
        demande.typeDemandeAide === this.typeAideSelectionne;

      return (
        correspondRecherche &&
        correspondCategorie &&
        correspondUrgence &&
        correspondStatut &&
        correspondTypeAide
      );
    });

    // Revenir à la première page après un changement de filtre
    this.pageActuelle = 1;
    this.calculerPagination();
  }

  // Calculer le nombre de pages
  calculerPagination(): void {
    this.nombrePages = Math.max(
      1,
      Math.ceil(
        this.demandesFiltrees.length / this.demandesParPage
      )
    );

    if (this.pageActuelle > this.nombrePages) {
      this.pageActuelle = this.nombrePages;
    }

    this.pages = Array.from(
      { length: this.nombrePages },
      (_, index) => index + 1
    );
  }

  // Demandes à afficher sur la page actuelle
  get demandesAffichees(): Demande[] {
    const debut = (this.pageActuelle - 1) * this.demandesParPage;

    return this.demandesFiltrees.slice(
      debut,
      debut + this.demandesParPage
    );
  }

  // Aller vers une page précise
  allerPage(page: number): void {
    if (page >= 1 && page <= this.nombrePages) {
      this.pageActuelle = page;
    }
  }

  // Page précédente
  pagePrecedente(): void {
    if (this.pageActuelle > 1) {
      this.pageActuelle--;
    }
  }

  // Page suivante
  pageSuivante(): void {
    if (this.pageActuelle < this.nombrePages) {
      this.pageActuelle++;
    }
  }

  // Afficher le nom du type d'aide
  getTypeAide(
    type: string | null | undefined
  ): string {
    switch (type) {
      case 'FINANCIERE':
        return 'Financière';

      case 'MATERIELLE':
        return 'Matérielle';

      default:
        return 'Non défini';
    }
  }

  // Calculer le montant nécessaire ou estimé
  getMontantEstime(demande: Demande): number {
    // Demande financière
    if (demande.typeDemandeAide === 'FINANCIERE') {
      return demande.montantNecessaire ?? 0;
    }

    // Demande matérielle : somme des quantités × prix unitaires
    if (demande.typeDemandeAide === 'MATERIELLE') {
      return (demande.articles ?? []).reduce(
        (total, article) =>
          total +
          (article.quantiteDemandee ?? 0) *
          (article.prixUnitaireEstime ?? 0),
        0
      );
    }

    return 0;
  }

  // Nombre d'articles d'une demande matérielle
  getNombreArticles(demande: Demande): number {
    return demande.articles?.length ?? 0;
  }

  // Classe CSS selon le type d'aide
  getClasseTypeAide(type: string | null | undefined): string {
    switch (type) {
      case 'FINANCIERE':
        return 'type-financiere';

      case 'MATERIELLE':
        return 'type-materielle';

      default:
        return '';
    }
  }

  // Classe CSS selon le statut
  getClasseStatut(statut: string): string {
    switch (statut) {
      case 'EN_ATTENTE':
        return 'attente';

      case 'VALIDEE':
        return 'validee';

      case 'REJETEE':
        return 'rejetee';

      default:
        return '';
    }
  }

  // Classe CSS selon le niveau d'urgence
  getClasseUrgence(urgence: string): string {
    switch (urgence) {
      case 'FORTE':
        return 'elevee';

      case 'MOYENNE':
        return 'moyenne';

      case 'FAIBLE':
        return 'faible';

      default:
        return '';
    }
  }

  // Ouvrir le formulaire de création
  nouvelleDemande(): void {
    this.router.navigate([
      '/organisation/demandes-aide/add-demandes-aide'
    ]);
  }

 voirDemande(id: number): void {
    this.router.navigate(['/organisation/demandes-aide', id]);
    
  }

  // Modifier une demande
  modifierDemande(id: number): void {
    this.router.navigate([
      '/organisation/demandes-aide',
      id,
      'modifier'
    ]);
  }
}