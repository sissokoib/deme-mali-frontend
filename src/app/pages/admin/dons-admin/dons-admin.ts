import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
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
  titreDemandeAide?: string;
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
  totalMontantStat: number | null = null;

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
    this.chargerStatistiques();
  }

  chargerStatistiques() {
    this.donService.getTotalDonsStatistiques().pipe(catchError(() => of(null))).subscribe({
      next: (total) => {
        if (total !== null && total !== undefined) {
          this.totalMontantStat = total;
        }
      }
    });
  }

  chargerDons() {
    this.isLoading = true;
    this.http.get<any[]>('http://localhost:8080/api/donateurs').pipe(catchError(() => of([]))).subscribe({
      next: (donateurs: any[]) => {
        const donateurMap = new Map<number, string>();
        if (donateurs) {
          donateurs.forEach(d => {
            donateurMap.set(d.id, `${d.prenom || ''} ${d.nom || ''}`.trim());
          });
        }
        this.recupererDons(donateurMap);
      },
      error: () => {
        this.recupererDons(new Map());
      }
    });
  }

  private recupererDons(donateurMap: Map<number, string>) {
    forkJoin({
      financiers: this.donService.getAllDonsFinanciers().pipe(catchError(() => of([]))),
      globaux: this.donService.getAllDons().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ financiers, globaux }) => {
        this.isLoading = false;

        const listeDons: DonItem[] = [];
        const seenFinancierIds = new Set<number>();

        // 1. Dons financiers avec les vrais montants et modes de paiement
        (financiers || []).forEach((df: any) => {
          if (df && df.id) {
            seenFinancierIds.add(df.id);
          }
          const nomDonateur = (df.donateurId && donateurMap.has(df.donateurId))
            ? donateurMap.get(df.donateurId)!
            : (df.nomDonateur || (df.anonyme ? 'Donateur anonyme' : 'Bienfaiteur Dèmè'));

          const mode = df.modePaiement
            ? df.modePaiement.replace(/_/g, ' ')
            : 'Orange Money';

          const statut = (df.statut === 'VALIDEE' || df.statut === 'Terminé' || !df.statut)
            ? 'Terminé'
            : (df.statut === 'EN_ATTENTE' ? 'En attente' : 'Terminé');

          listeDons.push({
            id: 'DON-FIN-' + String(df.id).padStart(3, '0'),
            rawId: df.id,
            donateur: nomDonateur,
            montant: `${(df.montant || 0).toLocaleString('fr-FR')} FCFA`,
            montantValue: df.montant || 0,
            categorie: 'Financier',
            mode: mode,
            statut: statut,
            statutClass: statut === 'Terminé' ? 'status-termine' : 'status-attente',
            date: df.dateDon ? new Date(df.dateDon).toLocaleDateString('fr-FR') : 'Aujourd\'hui',
            titreDemandeAide: df.titreDemandeAide || 'Aide solidaire'
          });
        });

        // 2. Dons matériels ou autres depuis globaux
        (globaux || []).forEach((g: any) => {
          if (g.typeDon === 'FINANCIER' && seenFinancierIds.has(g.id)) {
            return; // Déjà pris en compte avec le montant exact
          }
          const isMateriel = g.typeDon === 'MATERIEL' || g.quantite || g.designation;
          const nomDonateur = (g.donateurId && donateurMap.has(g.donateurId))
            ? donateurMap.get(g.donateurId)!
            : (g.donateurPrenom || g.donateurNom ? `${g.donateurPrenom || ''} ${g.donateurNom || ''}`.trim() : (g.anonyme ? 'Donateur anonyme' : 'Bienfaiteur Dèmè'));

          const statut = (g.statut === 'VALIDEE' || g.statut === 'RECUE' || g.statut === 'Terminé' || !g.statut)
            ? 'Terminé'
            : (g.statut === 'REFUSEE' ? 'Refusé' : 'En attente');

          const montantAffiche = isMateriel
            ? `${g.quantite || 1} ${g.unite || 'unité(s)'} (${g.designation || 'Don matériel'})`
            : `${(g.montant || 0).toLocaleString('fr-FR')} FCFA`;

          listeDons.push({
            id: (isMateriel ? 'DON-MAT-' : 'DON-') + String(g.id).padStart(3, '0'),
            rawId: g.id,
            donateur: nomDonateur,
            montant: montantAffiche,
            montantValue: isMateriel ? 0 : (g.montant || 0),
            categorie: isMateriel ? 'Matériel' : 'Financier',
            mode: g.modePaiement ? g.modePaiement.replace(/_/g, ' ') : (isMateriel ? 'Nature' : 'Orange Money'),
            statut: statut,
            statutClass: statut === 'Terminé' ? 'status-termine' : (statut === 'Refusé' ? 'status-refuse' : 'status-attente'),
            date: g.dateDon ? new Date(g.dateDon).toLocaleDateString('fr-FR') : 'Aujourd\'hui',
            titreDemandeAide: g.titreDemandeAide || 'Don direct'
          });
        });

        this.dons = listeDons;
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
      const selCatNorm = (this.selectedCategory || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const dCatNorm = (d.categorie || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const matchCat =
        !this.selectedCategory ||
        this.selectedCategory === 'Toutes les Catégories' ||
        selCatNorm.includes('toute')
          ? true
          : dCatNorm === selCatNorm;

      const selStatNorm = (this.selectedStatut || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const dStatNorm = (d.statut || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const matchStatut =
        !this.selectedStatut ||
        this.selectedStatut === 'Tous' ||
        selStatNorm === 'tous'
          ? true
          : dStatNorm === selStatNorm;

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
    if (this.totalMontantStat !== null && this.totalMontantStat > 0) {
      return this.totalMontantStat.toLocaleString('fr-FR') + ' FCFA';
    }
    const total = this.dons.reduce((sum, d) => sum + (d.montantValue || 0), 0);
    return total.toLocaleString('fr-FR') + ' FCFA';
  }

  getCountByStatut(statut: string): number {
    const target = (statut || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return this.dons.filter(d => {
      const s = (d.statut || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return s === target;
    }).length;
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
    if (d.categorie === 'Matériel' && d.rawId) {
      this.donService.confirmerReception(d.rawId, 1).subscribe({
        next: () => {},
        error: () => {}
      });
    }
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

    const parsedAmount = parseInt(this.nouveauDon.montant.replace(/\D/g, ''), 10) || 0;

    if (this.nouveauDon.categorie === 'Financier') {
      const dto = {
        montant: parsedAmount,
        modePaiement: this.nouveauDon.mode.toUpperCase().replace(/\s+/g, '_'),
        anonyme: false,
        nomDonateur: this.nouveauDon.donateur.trim(),
        statut: 'VALIDEE'
      };

      this.donService.creerDonFinancier(dto).subscribe({
        next: () => {
          this.chargerDons();
          this.chargerStatistiques();
          this.isModalOpen = false;
        },
        error: () => {
          this.chargerDons();
          this.isModalOpen = false;
        }
      });
    } else {
      const dto = {
        designation: this.nouveauDon.montant.trim(),
        quantite: 1,
        unite: 'lot',
        etatMateriel: 'BON_ETAT',
        anonyme: false,
        nomDonateur: this.nouveauDon.donateur.trim()
      };

      this.donService.creerDonMateriel(dto).subscribe({
        next: () => {
          this.chargerDons();
          this.isModalOpen = false;
        },
        error: () => {
          this.chargerDons();
          this.isModalOpen = false;
        }
      });
    }
  }
}
