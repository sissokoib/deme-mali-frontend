import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { of } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';
import { DonateurService } from '../../../services/donateur.service';
import { DonService } from '../../../services/don.service.ts';
import { DonateurResponseDTO } from '../../../models/donateur.model';

export interface DonateurItem {
  id: string;
  rawId: number;
  nom: string;
  prenom: string;
  nomComplet: string;
  telephone: string;
  email: string;
  paysNom: string;
  paysId?: number;
  statut: string;
  statutClass: string;
  dateInscription: string;
}

@Component({
  selector: 'app-donateurs-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './donateurs-admin.html',
  styleUrl: './donateurs-admin.css'
})
export class DonateursAdmin implements OnInit {
  searchTerm = '';
  filterTab = 'Tous';
  isLoading = false;
  donateurs: DonateurItem[] = [];
  donateurSelectionne: DonateurItem | null = null;
  totalDonsCount = 0;

  constructor(
    private donateurService: DonateurService,
    private donService: DonService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.chargerDonateurs();
    this.chargerTotalDons();
  }

  chargerTotalDons() {
    this.donService.getAllDons().pipe(
      catchError(() => of([]))
    ).subscribe({
      next: (dons: any[]) => {
        this.totalDonsCount = (dons || []).length;
        this.cdr.detectChanges();
      }
    });
  }

  chargerDonateurs(tentative = 1) {
    this.isLoading = true;
    this.donateurService.getAll().pipe(
      retry({ count: 2, delay: 1000 })
    ).subscribe({
      next: (data: any[]) => {
        this.isLoading = false;
        if (data && Array.isArray(data) && data.length > 0) {
          this.donateurs = data.map((d: any) => {
            const nomComplet = `${d.prenom || ''} ${d.nom || ''}`.trim() || 'Donateur anonyme';
            const nomPays = d.paysNom || (d.pays && d.pays.nom) || 'Mali';

            return {
              id: 'DON' + String(d.id).padStart(3, '0'),
              rawId: d.id,
              nom: d.nom || '',
              prenom: d.prenom || '',
              nomComplet: nomComplet,
              telephone: d.telephone || '+223 70 00 00 00',
              email: d.email || (d.telephone ? `${d.telephone}@dememali.ml` : ''),
              paysNom: nomPays,
              paysId: d.paysId,
              statut: 'Donateur Actif',
              statutClass: 'status-valide',
              dateInscription: 'Compte actif'
            };
          });
        } else {
          this.donateurs = [];
          if (tentative <= 2) {
            setTimeout(() => this.chargerDonateurs(tentative + 1), 2000);
          }
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        console.warn('Erreur chargement donateurs', err);
        if (tentative <= 3) {
          setTimeout(() => this.chargerDonateurs(tentative + 1), 2000);
        }
        this.cdr.detectChanges();
      }
    });
  }

  get donateursFiltres(): DonateurItem[] {
    const q = this.searchTerm.trim().toLowerCase();
    if (!q) return this.donateurs;
    return this.donateurs.filter(d =>
      d.nomComplet.toLowerCase().includes(q) ||
      d.id.toLowerCase().includes(q) ||
      d.telephone.includes(q) ||
      d.paysNom.toLowerCase().includes(q)
    );
  }

  setTab(tab: string) {
    this.filterTab = tab;
    this.pageActuelle = 1;
  }

  // Pagination (10 par page, mode défilement)
  pageActuelle = 1;
  elementsParPage = 10;

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.donateursFiltres.length / this.elementsParPage));
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get donateursPagines(): DonateurItem[] {
    const debut = (this.pageActuelle - 1) * this.elementsParPage;
    return this.donateursFiltres.slice(debut, debut + this.elementsParPage);
  }

  allerPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.pageActuelle = page;
    }
  }

  pagePrecedente(): void {
    if (this.pageActuelle > 1) {
      this.pageActuelle--;
    }
  }

  pageSuivante(): void {
    if (this.pageActuelle < this.totalPages) {
      this.pageActuelle++;
    }
  }

  getCount(tab: string = 'Tous'): number {
    return this.donateurs.length;
  }

  getTotalMali(): number {
    return this.donateurs.filter(d => d.paysNom.toLowerCase().includes('mali')).length;
  }

  getTotalInternational(): number {
    return this.donateurs.filter(d => !d.paysNom.toLowerCase().includes('mali')).length;
  }

  getTotalDons(): number {
    return this.totalDonsCount;
  }

  ouvrirDetails(d: DonateurItem) {
    this.donateurSelectionne = d;
  }

  fermerDetails() {
    this.donateurSelectionne = null;
  }
}
