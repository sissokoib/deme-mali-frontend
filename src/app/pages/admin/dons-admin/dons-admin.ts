import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DonService } from '../../../services/don.service.ts';

export interface DonItem {
  id: string;
  rawId?: number;
  donateur: string;
  montant: string;
  montantValue?: number;
  categorie: string;
  mode: string;
  statut: string;
  statutClass: string;
  date?: string;
}

@Component({
  selector: 'app-dons-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dons-admin.html',
  styleUrl: './dons-admin.css',
})
export class DonsAdmin implements OnInit {
  isModalOpen = false;
  isFilterMenuOpen = false;
  selectedCategory = 'Toutes les Catégories';
  selectedStatut = 'Tous';
  searchTerm = '';
  donSelectionne: DonItem | null = null;
  isLoading = false;

  nouveauDon = {
    donateur: '',
    montant: '',
    categorie: 'Financier',
    mode: 'Orange Money',
    statut: 'Terminé'
  };

  dons: DonItem[] = [];

  constructor(
    private donService: DonService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.chargerDons();
  }

  chargerDons() {
    this.isLoading = true;
    // Charge les donateurs pour afficher les vrais noms
    this.http.get<any[]>('http://localhost:8080/api/donateurs').subscribe({
      next: (donateurs: any[]) => {
        const donateurMap = new Map<number, string>();
        if (donateurs) {
          donateurs.forEach(d => {
            donateurMap.set(d.id, `${d.prenom || ''} ${d.nom || ''}`.trim());
          });
        }
        this.recupererDonsFinanciers(donateurMap);
      },
      error: () => {
        this.recupererDonsFinanciers(new Map());
      }
    });
  }

  private recupererDonsFinanciers(donateurMap: Map<number, string>) {
    this.donService.getAllDonsFinanciers().subscribe({
      next: (donsFinanciers) => {
        this.isLoading = false;
        if (donsFinanciers && donsFinanciers.length > 0) {
          this.dons = donsFinanciers.map((df: any) => {
            const nomDonateur = df.anonyme
              ? 'Donateur anonyme'
              : (df.donateurId && donateurMap.has(df.donateurId)
                  ? donateurMap.get(df.donateurId)!
                  : (df.nomDonateur || 'Bienfaiteur Dèmè'));
            
            const mode = df.modePaiement
              ? df.modePaiement.replace('_', ' ')
              : 'Orange Money';

            const statut = df.statut === 'VALIDEE' || df.statut === 'Terminé' || !df.statut
              ? 'Terminé'
              : (df.statut === 'EN_ATTENTE' ? 'En attente' : 'Terminé');

            return {
              id: 'DON' + String(df.id).padStart(3, '0'),
              rawId: df.id,
              donateur: nomDonateur,
              montant: `${(df.montant || 0).toLocaleString('fr-FR')} FCFA`,
              montantValue: df.montant || 0,
              categorie: 'Financier',
              mode: mode,
              statut: statut,
              statutClass: statut === 'Terminé' ? 'status-termine' : 'status-attente',
              date: df.dateDon ? new Date(df.dateDon).toLocaleDateString('fr-FR') : '12/10/2026'
            };
          });
        } else {
          this.dons = [];
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.dons = [];
        console.warn('Erreur chargement des dons depuis le backend', err);
      }
    });
  }

  get donsFiltres(): DonItem[] {
    return this.dons.filter(d => {
      const matchCat =
        this.selectedCategory === 'Toutes les Catégories' ? true :
        d.categorie.toLowerCase() === this.selectedCategory.toLowerCase();

      const matchStatut =
        this.selectedStatut === 'Tous' ? true :
        d.statut.toLowerCase() === this.selectedStatut.toLowerCase();

      const q = this.searchTerm.trim().toLowerCase();
      const matchSearch = !q ? true :
        d.donateur.toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q) ||
        d.categorie.toLowerCase().includes(q) ||
        d.mode.toLowerCase().includes(q);

      return matchCat && matchStatut && matchSearch;
    });
  }

  toggleFilterMenu() {
    this.isFilterMenuOpen = !this.isFilterMenuOpen;
  }

  selectCategory(cat: string) {
    this.selectedCategory = cat;
    this.isFilterMenuOpen = false;
  }

  setStatutFilter(statut: string) {
    this.selectedStatut = statut;
  }

  getTotalMontantFinancier(): string {
    const total = this.dons.reduce((sum, d) => sum + (d.montantValue || 0), 0);
    return total.toLocaleString('fr-FR') + ' FCFA';
  }

  getCountByStatut(statut: string): number {
    return this.dons.filter(d => d.statut.toLowerCase() === statut.toLowerCase()).length;
  }

  ouvrirDetails(d: DonItem) {
    this.donSelectionne = d;
  }

  fermerDetails() {
    this.donSelectionne = null;
  }

  confirmerReception(d: DonItem) {
    d.statut = 'Terminé';
    d.statutClass = 'status-termine';
    if (this.donSelectionne && this.donSelectionne.id === d.id) {
      this.donSelectionne.statut = 'Terminé';
      this.donSelectionne.statutClass = 'status-termine';
    }
  }

  ouvrirModal() {
    this.nouveauDon = {
      donateur: '',
      montant: '',
      categorie: 'Financier',
      mode: 'Orange Money',
      statut: 'Terminé'
    };
    this.isModalOpen = true;
  }

  fermerModal() {
    this.isModalOpen = false;
  }

  enregistrerDon() {
    if (!this.nouveauDon.donateur.trim() || !this.nouveauDon.montant.trim()) {
      return;
    }

    const nextId = 'DON' + String(this.dons.length + 1).padStart(3, '0');
    const statutClass = this.nouveauDon.statut === 'Terminé' ? 'status-termine' : 'status-attente';
    const parsedAmount = parseInt(this.nouveauDon.montant.replace(/\D/g, ''), 10) || 0;
    const today = new Date().toLocaleDateString('fr-FR');

    const item: DonItem = {
      id: nextId,
      donateur: this.nouveauDon.donateur.trim(),
      montant: this.nouveauDon.montant.trim(),
      montantValue: parsedAmount,
      categorie: this.nouveauDon.categorie,
      mode: this.nouveauDon.mode,
      statut: this.nouveauDon.statut,
      statutClass: statutClass,
      date: today
    };

    this.dons.unshift(item);
    this.isModalOpen = false;
  }
}

