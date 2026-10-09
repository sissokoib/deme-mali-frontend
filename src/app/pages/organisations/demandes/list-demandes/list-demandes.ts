
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Demande, CategorieDemande } from '../../../../models/demande.model';
import { demandeAideService } from '../../../../services/demande-aide';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-list-demandes',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './list-demandes.html',
  styleUrl: './list-demandes.css'
})
export class ListDemandes implements OnInit {
  demandes: Demande[] = [];
  demandesFiltrees: Demande[] = [];
  recherche = '';
  categories: CategorieDemande[] = [];
  categorieSelectionnee = '';
  urgenceSelectionnee = '';
  statutSelectionne = '';
  totalDemandes = 0;
  demandesRefusees = 0;
  demandesAttente = 0;
  demandesTraitees = 0;
  demandesParPage = 5;
  pageActuelle = 1;
  pages: number[] = [];
  nombrePages = 1;

  constructor(private demandeAideService: demandeAideService, private authService: AuthService, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.chargerDemandes();
    this.chargerCategories();
  }

  chargerCategories(): void {
    this.demandeAideService.getCategories().subscribe({
      next: (data) => this.categories = data,
      error: (error) => console.error('Erreur lors du chargement des catégories', error)
    });
  }

  chargerDemandes(): void {
    const utilisateur = this.authService.getCurrentUser();
    if (!utilisateur?.id) {
      console.error('Aucun utilisateur connecté ou identifiant absent');
      return;
    }
    this.demandeAideService.getDemandesParOrganisation(utilisateur.id).subscribe({
      next: (data) => {
        this.demandes = data.sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime());
        this.calculerStatistiques();
        this.filtrer();
        this.cdr.detectChanges();
      },
      error: (error) => console.error('Erreur lors du chargement des demandes', error)
    });
  }

  calculerStatistiques(): void {
    this.totalDemandes = this.demandes.length;
    this.demandesRefusees = this.demandes.filter(demande => demande.statut === 'REJETEE').length;
    this.demandesAttente = this.demandes.filter(demande => demande.statut === 'EN_ATTENTE').length;
    this.demandesTraitees = this.demandes.filter(demande => demande.statut === 'VALIDEE' || demande.statut === 'PUBLIEE').length;
  }

  filtrer(): void {
    const rechercheTexte = this.recherche.trim().toLowerCase();
    this.demandesFiltrees = this.demandes.filter(demande => {
      const titre = demande.titre?.toLowerCase() || '';
      const nom = demande.beneficiaireNom?.toLowerCase() || '';
      const prenom = demande.beneficiairePrenom?.toLowerCase() || '';
      const correspondRecherche = titre.includes(rechercheTexte) || nom.includes(rechercheTexte) || prenom.includes(rechercheTexte);
      const correspondCategorie = !this.categorieSelectionnee || demande.categorieDemandeNom === this.categorieSelectionnee;
      const correspondUrgence = !this.urgenceSelectionnee || demande.niveauUrgence === this.urgenceSelectionnee;
      const correspondStatut = !this.statutSelectionne || demande.statut === this.statutSelectionne;
      return correspondRecherche && correspondCategorie && correspondUrgence && correspondStatut;
    });
    this.pageActuelle = 1;
    this.calculerPagination();
  }

  calculerPagination(): void {
    this.nombrePages = Math.max(1, Math.ceil(this.demandesFiltrees.length / this.demandesParPage));
    if (this.pageActuelle > this.nombrePages) this.pageActuelle = this.nombrePages;
    this.pages = [];
    for (let i = 1; i <= this.nombrePages; i++) this.pages.push(i);
  }

  allerPage(page: number): void {
    if (page >= 1 && page <= this.nombrePages) this.pageActuelle = page;
  }

  pagePrecedente(): void {
    if (this.pageActuelle > 1) this.pageActuelle--;
  }

  pageSuivante(): void {
    if (this.pageActuelle < this.nombrePages) this.pageActuelle++;
  }

  nouvelleDemande(): void {
    this.router.navigate(['/organisation/add-demandes-aide']);
  }

  voirDemande(id: number): void {
    this.router.navigate(['/organisation/demandes-aide', id]);
  }

  modifierDemande(id: number): void {
    this.router.navigate(['/organisation/demandes-aide', id, 'modifier']);
  }

  getClasseStatut(statut: string): string {
    switch (statut) {
      case 'EN_ATTENTE': return 'attente';
      case 'VALIDEE': return 'validee';
      case 'REJETEE': return 'rejetee';
      case 'PUBLIEE': return 'publiee';
      default: return '';
    }
  }

  getClasseUrgence(urgence: string): string {
    switch (urgence) {
      case 'FORTE': return 'elevee';
      case 'MOYENNE': return 'moyenne';
      case 'FAIBLE': return 'faible';
      default: return '';
    }
  }
}

