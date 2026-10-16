import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

import { AttributionDonLibreService } from '../../../services/attribution-don-libre.service';
import { AuthService } from '../../../services/auth.service';
import { AttributionDonLibre } from '../../../models/attribution-don-libre.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dons-attribues',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './dons-attribues.html',
  styleUrl: './dons-attribues.css'
})
export class DonsAttribues implements OnInit {

  attributions: AttributionDonLibre[] = [];

  ongletActif: 'FINANCIER' | 'MATERIEL' = 'FINANCIER';

  chargement = false;
  erreur = false;

  pageActuelle = 1;
  taillePage = 5;

  attributionSelectionnee: AttributionDonLibre | null = null;

  constructor(
    private attributionService: AttributionDonLibreService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.chargerAttributions();
  }

  // Charger les dons attribués à l'organisation connectée
  chargerAttributions(): void {
    const utilisateur = this.authService.getCurrentUser();

    if (!utilisateur || !utilisateur.id) {
      this.erreur = true;
      this.cdr.detectChanges();
      return;
    }

    this.chargement = true;
    this.erreur = false;

    this.attributionService
      .getParOrganisation(Number(utilisateur.id))
      .subscribe({
        next: (resultat) => {
          this.attributions = resultat;
          this.pageActuelle = 1;
          this.chargement = false;

          this.cdr.detectChanges();
        },
        error: () => {
          this.erreur = true;
          this.chargement = false;

          this.cdr.detectChanges();
        }
      });
  }

  // Séparer les dons financiers
  get donsFinanciers(): AttributionDonLibre[] {
    return this.attributions.filter(
      don => don.donFinancierId !== null
    );
  }

  // Séparer les dons matériels
  get donsMateriels(): AttributionDonLibre[] {
    return this.attributions.filter(
      don => don.donMaterielId !== null
    );
  }

  // Liste selon l'onglet choisi
  get donsAffiches(): AttributionDonLibre[] {
    return this.ongletActif === 'FINANCIER'
      ? this.donsFinanciers
      : this.donsMateriels;
  }

  // Statistiques
  get montantFinancier(): number {
    return this.donsFinanciers.reduce(
      (total, don) => total + (don.montantAttribue || 0),
      0
    );
  }

  get quantiteMaterielle(): number {
    return this.donsMateriels.reduce(
      (total, don) => total + (don.quantiteAttribuee || 0),
      0
    );
  }

  get nombreAttributions(): number {
    return this.attributions.length;
  }

  // Pagination
  get totalPages(): number {
    return Math.ceil(this.donsAffiches.length / this.taillePage);
  }

  get donsPagines(): AttributionDonLibre[] {
    const debut = (this.pageActuelle - 1) * this.taillePage;

    return this.donsAffiches.slice(
      debut,
      debut + this.taillePage
    );
  }

  get pages(): number[] {
    return Array.from(
      { length: this.totalPages },
      (_, index) => index + 1
    );
  }

  changerOnglet(onglet: 'FINANCIER' | 'MATERIEL'): void {
    this.ongletActif = onglet;
    this.pageActuelle = 1;
    this.attributionSelectionnee = null;
  }

  changerPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.pageActuelle = page;
    }
  }

  // Afficher les détails
 voirDetails(don: AttributionDonLibre): void {
  this.router.navigate([
    '/organisation/dons-attribues/detail',
    don.id
  ]);
}

fermerDetails(): void {
  this.router.navigate(['/organisation/dons-attribues']);
}
}