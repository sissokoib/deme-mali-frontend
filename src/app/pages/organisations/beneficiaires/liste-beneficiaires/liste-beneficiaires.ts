
import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { AuthService } from '../../../../services/auth.service';
import { Beneficiaire } from '../../../../models/beneficiaire.model';
import { BeneficiaireService } from '../../../../services/beneficiaire';
import { Router } from '@angular/router';

@Component({
  selector: 'app-liste-beneficiaires',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    FormsModule,
    
  ],
  templateUrl: './liste-beneficiaires.html',
  styleUrl: './liste-beneficiaires.css'
})
export class ListeBeneficiaires implements OnInit {

  private authService = inject(AuthService);
  private beneficiaireService = inject(BeneficiaireService);
  private cdr = inject(ChangeDetectorRef);
private router = inject(Router);
  beneficiaires: Beneficiaire[] = [];

  chargement = true;
  erreur = '';
  recherche = '';
  traitementId: number | null = null;

  taillePage = 10;
  pageActuelle = 1;

  ngOnInit(): void {
    this.chargerBeneficiaires();
  }

  // Charger les bénéficiaires de l'organisation connectée
  chargerBeneficiaires(): void {

    const utilisateur = this.authService.getCurrentUser();

    if (!utilisateur) {
      this.erreur = 'Utilisateur non connecté.';
      this.chargement = false;
      return;
    }

    if (utilisateur.role !== 'ORGANISATIONPARTENAIRE') {
      this.erreur = 'Cette page est réservée aux organisations.';
      this.chargement = false;
      return;
    }

    this.beneficiaireService
      .trouverParOrganisation(utilisateur.id)
      .subscribe({

        next: (data) => {
          this.beneficiaires = data;
          this.pageActuelle = 1;
          this.chargement = false;
          this.cdr.detectChanges();
        },

        error: (erreur) => {
          console.error(
            'Erreur lors du chargement des bénéficiaires :',
            erreur
          );

          this.erreur = 'Impossible de charger les bénéficiaires.';
          this.chargement = false;
          this.cdr.detectChanges();
        }

      });
  }

  // Compter les bénéficiaires selon leur statut
  compterStatut(statut: string): number {
    return this.beneficiaires.filter(
      beneficiaire => beneficiaire.statut === statut
    ).length;
  }

  // Rechercher par nom, prénom ou ville
  beneficiairesFiltres(): Beneficiaire[] {

    const rechercheTexte = this.recherche.trim().toLowerCase();

    return this.beneficiaires.filter(beneficiaire => {

      const texte = (
        (beneficiaire.nom || '') + ' ' +
        (beneficiaire.prenom || '') + ' ' +
        (beneficiaire.ville || '')
      ).toLowerCase();

      return texte.includes(rechercheTexte);
    });
  }

  // Afficher uniquement les bénéficiaires de la page actuelle
  beneficiairesParPage(): Beneficiaire[] {

    const debut = (this.pageActuelle - 1) * this.taillePage;

    return this.beneficiairesFiltres().slice(
      debut,
      debut + this.taillePage
    );
  }

  // Calculer le nombre total de pages
  nombrePages(): number {
    return Math.ceil(
      this.beneficiairesFiltres().length / this.taillePage
    );
  }

  // Changer de page
  changerPage(page: number): void {

    if (page >= 1 && page <= this.nombrePages()) {
      this.pageActuelle = page;
    }
  }

  // Page précédente
  pagePrecedente(): void {
    this.changerPage(this.pageActuelle - 1);
  }

  // Page suivante
  pageSuivante(): void {
    this.changerPage(this.pageActuelle + 1);
  }

  // Revenir à la première page après une recherche
  reinitialiserPage(): void {
    this.pageActuelle = 1;
  }

  voirDetails(id: number): void {
  this.router.navigate([
    '/organisation/beneficiaires',
    id
  ]);
}
}
