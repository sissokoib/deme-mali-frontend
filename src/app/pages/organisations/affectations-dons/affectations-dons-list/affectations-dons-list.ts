
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin } from 'rxjs';

import { AffectationDonService } from '../../../../services/affectation-don';
import {
  AffectationFinanciere,
  AffectationMaterielle
} from '../../../../models/affectation-don.model';

type TypeOnglet = 'FINANCIER' | 'MATERIEL';

@Component({
  selector: 'app-affectations-dons-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule
  ],
  templateUrl: './affectations-dons-list.html',
  styleUrl: './affectations-dons-list.css'
})
export class AffectationsDonsList implements OnInit {

  financieres: AffectationFinanciere[] = [];
  materielles: AffectationMaterielle[] = [];

  chargement = true;
  erreur = false;

  // Onglet affiché
  ongletActif: TypeOnglet = 'FINANCIER';

  // Fenêtre de détails
  detailsOuverts = false;
  typeDetails: TypeOnglet = 'FINANCIER';

  detailFinancier: AffectationFinanciere | null = null;
  detailMateriel: AffectationMaterielle | null = null;

  constructor(
    private service: AffectationDonService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.chargerAffectations();
  }

  // Charger les affectations financières et matérielles
  chargerAffectations(): void {
    this.chargement = true;
    this.erreur = false;

    forkJoin({
      financieres: this.service.getAffectationsFinancieres(),
      materielles: this.service.getAffectationsMaterielles()
    }).subscribe({
      next: (resultat) => {
        this.financieres = resultat.financieres;
        this.materielles = resultat.materielles;

        this.chargement = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(
          'Erreur lors du chargement des affectations :',
          err
        );

        this.erreur = true;
        this.chargement = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Pagination (10 éléments par page)
  pageActuelleFinanciere = 1;
  pageActuelleMaterielle = 1;
  elementsParPage = 10;

  get totalPagesFinancieres(): number {
    return Math.max(1, Math.ceil(this.financieres.length / this.elementsParPage));
  }

  get pagesFinancieres(): number[] {
    return Array.from({ length: this.totalPagesFinancieres }, (_, i) => i + 1);
  }

  get financieresPaginees(): AffectationFinanciere[] {
    const debut = (this.pageActuelleFinanciere - 1) * this.elementsParPage;
    return this.financieres.slice(debut, debut + this.elementsParPage);
  }

  get totalPagesMaterielles(): number {
    return Math.max(1, Math.ceil(this.materielles.length / this.elementsParPage));
  }

  get pagesMaterielles(): number[] {
    return Array.from({ length: this.totalPagesMaterielles }, (_, i) => i + 1);
  }

  get materiellesPaginees(): AffectationMaterielle[] {
    const debut = (this.pageActuelleMaterielle - 1) * this.elementsParPage;
    return this.materielles.slice(debut, debut + this.elementsParPage);
  }

  allerPageFinanciere(page: number): void {
    if (page >= 1 && page <= this.totalPagesFinancieres) {
      this.pageActuelleFinanciere = page;
    }
  }

  pagePrecedenteFinanciere(): void {
    if (this.pageActuelleFinanciere > 1) {
      this.pageActuelleFinanciere--;
    }
  }

  pageSuivanteFinanciere(): void {
    if (this.pageActuelleFinanciere < this.totalPagesFinancieres) {
      this.pageActuelleFinanciere++;
    }
  }

  allerPageMaterielle(page: number): void {
    if (page >= 1 && page <= this.totalPagesMaterielles) {
      this.pageActuelleMaterielle = page;
    }
  }

  pagePrecedenteMaterielle(): void {
    if (this.pageActuelleMaterielle > 1) {
      this.pageActuelleMaterielle--;
    }
  }

  pageSuivanteMaterielle(): void {
    if (this.pageActuelleMaterielle < this.totalPagesMaterielles) {
      this.pageActuelleMaterielle++;
    }
  }

  // Changer d'onglet
  changerOnglet(onglet: TypeOnglet): void {
    this.ongletActif = onglet;
    this.pageActuelleFinanciere = 1;
    this.pageActuelleMaterielle = 1;
  }

  // Ouvrir les détails d'une affectation financière
  voirDetailsFinanciers(affectation: AffectationFinanciere): void {
    this.detailFinancier = affectation;
    this.detailMateriel = null;
    this.typeDetails = 'FINANCIER';
    this.detailsOuverts = true;
  }

  // Ouvrir les détails d'une affectation matérielle
  voirDetailsMateriels(affectation: AffectationMaterielle): void {
    this.detailMateriel = affectation;
    this.detailFinancier = null;
    this.typeDetails = 'MATERIEL';
    this.detailsOuverts = true;
  }

  // Fermer la fenêtre de détails
  fermerDetails(): void {
    this.detailsOuverts = false;
    this.detailFinancier = null;
    this.detailMateriel = null;
  }

  // Accéder au formulaire de nouvelle affectation
  ajouterAffectation(): void {
    this.router.navigateByUrl(
      '/organisation/affectations-dons/add-affection-don'
    );
  }
}
