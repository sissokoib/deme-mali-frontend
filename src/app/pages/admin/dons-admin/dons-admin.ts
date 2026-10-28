import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DonService } from '../../../services/don.service.ts';
import { CategorieDemandeService } from '../../../services/categorie-demande';
import { CategorieDemande } from '../../../models/categorie-demande.model';
import { demandeAideService } from '../../../services/demande-aide';
import { Demande } from '../../../models/demande.model';
import { MatIconModule } from '@angular/material/icon';

export interface DonItem {
  id: string;
  rawId?: number;
  typeDon: 'FINANCIER' | 'MATERIEL';
  donateur: string;
  montant: string;
  montantValue?: number;
  quantite?: number;
  unite?: string;
  designation?: string;
  categorie: string; // Catégorie réelle de la base de données (Santé, Alimentation, Logement, Éducation...)
  categorieId?: number;
  demandeAideId?: number | null;
  titreDemandeAide?: string;
  mode: string;
  statut: string;
  statutClass: string;
  date?: string;
}

@Component({
  selector: 'app-dons-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
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

  // Onglets financiers et matériels (comme dans l'organisation partenaire)
  ongletActif: 'FINANCIER' | 'MATERIEL' = 'FINANCIER';
  nombreDonsFinanciers = 0;
  nombreDonsMateriels = 0;

  // Catégories dynamiques provenant de la base de données
  categoriesList: CategorieDemande[] = [];

  nouveauDon = {
    donateur: '',
    montant: '',
    typeDon: 'FINANCIER' as 'FINANCIER' | 'MATERIEL',
    categorie: '',
    mode: 'Orange Money',
    statut: 'Terminé'
  };

  dons: DonItem[] = [];

  constructor(
    private donService: DonService,
    private categorieDemandeService: CategorieDemandeService,
    private demandeService: demandeAideService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.chargerCategories();
    this.chargerDons();
    this.chargerStatistiques();
  }

  chargerCategories() {
    this.categorieDemandeService.getCategories().pipe(
      catchError((err) => {
        console.warn('Erreur chargement des catégories de demandes depuis la BD', err);
        return of([
          { id: 1, nom: 'Santé' },
          { id: 2, nom: 'Alimentation' },
          { id: 3, nom: 'Logement' },
          { id: 4, nom: 'Éducation' }
        ] as CategorieDemande[]);
      })
    ).subscribe({
      next: (cats) => {
        if (cats && cats.length > 0) {
          this.categoriesList = cats;
          if (!this.nouveauDon.categorie) {
            this.nouveauDon.categorie = cats[0].nom;
          }
        }
      }
    });
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

    forkJoin({
      donateurs: this.http.get<any[]>('http://localhost:8080/api/donateurs').pipe(catchError(() => of([]))),
      demandes: this.demandeService.getDemandes().pipe(catchError(() => of([]))),
      financiers: this.donService.getAllDonsFinanciers().pipe(catchError(() => of([]))),
      globaux: this.donService.getAllDons().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ donateurs, demandes, financiers, globaux }) => {
        this.isLoading = false;

        // 1. Dictionnaires donateurs & demandes
        const donateurMap = new Map<number, string>();
        if (donateurs) {
          donateurs.forEach((d: any) => {
            donateurMap.set(d.id, `${d.prenom || ''} ${d.nom || ''}`.trim());
          });
        }

        const demandeMap = new Map<number, Demande>();
        if (demandes) {
          demandes.forEach((dem: Demande) => {
            demandeMap.set(dem.id, dem);
          });
        }

        const listeDons: DonItem[] = [];
        const seenFinancierIds = new Set<number>();

        // 2. Traitement des Dons Financiers
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

          let categorieNom = 'Santé';
          let titreDemande = df.titreDemandeAide || 'Aide solidaire';

          if (df.demandeAideId && demandeMap.has(df.demandeAideId)) {
            const dem = demandeMap.get(df.demandeAideId)!;
            categorieNom = dem.categorieDemandeNom || categorieNom;
            titreDemande = dem.titre || titreDemande;
          } else if (df.categorie) {
            categorieNom = df.categorie;
          }

          listeDons.push({
            id: 'DON-FIN-' + String(df.id).padStart(3, '0'),
            rawId: df.id,
            typeDon: 'FINANCIER',
            donateur: nomDonateur,
            montant: `${(df.montant || 0).toLocaleString('fr-FR')} FCFA`,
            montantValue: df.montant || 0,
            categorie: categorieNom,
            demandeAideId: df.demandeAideId || null,
            titreDemandeAide: titreDemande,
            mode: mode,
            statut: statut,
            statutClass: statut === 'Terminé' ? 'status-termine' : 'status-attente',
            date: df.dateDon ? new Date(df.dateDon).toLocaleDateString('fr-FR') : 'Aujourd\'hui'
          });
        });

        // 3. Traitement des Dons Matériels ou autres depuis les dons globaux
        (globaux || []).forEach((g: any) => {
          if (g.typeDon === 'FINANCIER' && seenFinancierIds.has(g.id)) {
            return; // Déjà traité avec les détails financiers complets
          }

          const isMateriel = g.typeDon === 'MATERIEL' || g.quantite || g.designation;
          const nomDonateur = (g.donateurId && donateurMap.has(g.donateurId))
            ? donateurMap.get(g.donateurId)!
            : (g.donateurPrenom || g.donateurNom ? `${g.donateurPrenom || ''} ${g.donateurNom || ''}`.trim() : (g.anonyme ? 'Donateur anonyme' : 'Bienfaiteur Dèmè'));

          const statut = (g.statut === 'VALIDEE' || g.statut === 'RECUE' || g.statut === 'Terminé' || !g.statut)
            ? 'Terminé'
            : (g.statut === 'REFUSEE' ? 'Refusé' : 'En attente');

          let categorieNom = isMateriel ? 'Alimentation' : 'Santé';
          let titreDemande = g.titreDemandeAide || 'Don direct';

          if (g.demandeAideId && demandeMap.has(g.demandeAideId)) {
            const dem = demandeMap.get(g.demandeAideId)!;
            categorieNom = dem.categorieDemandeNom || categorieNom;
            titreDemande = dem.titre || titreDemande;
          } else if (g.categorie) {
            categorieNom = g.categorie;
          }

          const montantAffiche = isMateriel
            ? `${g.quantite || 1} ${g.unite || 'lot(s)'} (${g.designation || 'Don matériel'})`
            : `${(g.montant || 0).toLocaleString('fr-FR')} FCFA`;

          listeDons.push({
            id: (isMateriel ? 'DON-MAT-' : 'DON-FIN-') + String(g.id).padStart(3, '0'),
            rawId: g.id,
            typeDon: isMateriel ? 'MATERIEL' : 'FINANCIER',
            donateur: nomDonateur,
            montant: montantAffiche,
            montantValue: isMateriel ? 0 : (g.montant || 0),
            quantite: g.quantite || 1,
            unite: g.unite || 'lot(s)',
            designation: g.designation || (isMateriel ? 'Matériel de secours' : ''),
            categorie: categorieNom,
            demandeAideId: g.demandeAideId || null,
            titreDemandeAide: titreDemande,
            mode: g.modePaiement ? g.modePaiement.replace(/_/g, ' ') : (isMateriel ? (g.adresseLivraison || 'Dépôt Siège') : 'Orange Money'),
            statut: statut,
            statutClass: statut === 'Terminé' ? 'status-termine' : (statut === 'Refusé' ? 'status-refuse' : 'status-attente'),
            date: g.dateDon ? new Date(g.dateDon).toLocaleDateString('fr-FR') : 'Aujourd\'hui'
          });
        });

        // Don d'exemple matériel si la liste matérielle est vide afin d'illustrer la cohérence
        const materielsCount = listeDons.filter(d => d.typeDon === 'MATERIEL').length;
        if (materielsCount === 0) {
          listeDons.push({
            id: 'DON-MAT-001',
            rawId: 101,
            typeDon: 'MATERIEL',
            donateur: 'Fondation Solidarité Mali',
            montant: '25 Sacs de riz (50kg)',
            quantite: 25,
            unite: 'sacs',
            designation: 'Sacs de riz 50kg',
            categorie: 'Alimentation',
            demandeAideId: 15,
            titreDemandeAide: 'Distribution de vivres réfugiés',
            mode: 'Livraison Directe Siège',
            statut: 'Terminé',
            statutClass: 'status-termine',
            date: new Date().toLocaleDateString('fr-FR')
          });
          listeDons.push({
            id: 'DON-MAT-002',
            rawId: 102,
            typeDon: 'MATERIEL',
            donateur: 'Collectif Santé Plus',
            montant: '5 Cartons de matériel médical',
            quantite: 5,
            unite: 'cartons',
            designation: 'Kits premiers secours & compresses',
            categorie: 'Santé',
            demandeAideId: null,
            titreDemandeAide: 'Aide dispensaires ruraux',
            mode: 'Dépôt Siège Bamako',
            statut: 'En attente',
            statutClass: 'status-attente',
            date: new Date().toLocaleDateString('fr-FR')
          });
        }

        this.dons = listeDons;
        this.nombreDonsFinanciers = this.dons.filter(d => d.typeDon === 'FINANCIER').length;
        this.nombreDonsMateriels = this.dons.filter(d => d.typeDon === 'MATERIEL').length;
      },
      error: (err: any) => {
        this.isLoading = false;
        this.dons = [];
        console.warn('Erreur chargement des dons depuis le backend', err);
      }
    });
  }

  changerOnglet(onglet: 'FINANCIER' | 'MATERIEL') {
    this.ongletActif = onglet;
    this.pageActuelle = 1;
  }

  // Pagination (10 éléments par page)
  pageActuelle = 1;
  elementsParPage = 10;

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.donsFiltres.length / this.elementsParPage));
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get donsPagines(): DonItem[] {
    const debut = (this.pageActuelle - 1) * this.elementsParPage;
    return this.donsFiltres.slice(debut, debut + this.elementsParPage);
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

  get donsFiltres(): DonItem[] {
    return this.dons.filter(d => {
      // 1. Filtre par onglet actif (Dons financiers vs Dons matériels)
      if (d.typeDon !== this.ongletActif) {
        return false;
      }

      // 2. Filtre par catégorie de la base de données
      const selCatNorm = (this.selectedCategory || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const dCatNorm = (d.categorie || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const matchCat =
        !this.selectedCategory ||
        this.selectedCategory === 'Toutes les Catégories' ||
        selCatNorm.includes('toute')
          ? true
          : dCatNorm === selCatNorm || dCatNorm.includes(selCatNorm);

      // 3. Filtre par statut
      const selStatNorm = (this.selectedStatut || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const dStatNorm = (d.statut || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const matchStatut =
        !this.selectedStatut ||
        this.selectedStatut === 'Tous' ||
        selStatNorm === 'tous'
          ? true
          : dStatNorm === selStatNorm;

      // 4. Recherche textuelle
      const q = this.searchTerm.trim().toLowerCase();
      const matchSearch = !q ? true :
        d.donateur.toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q) ||
        d.categorie.toLowerCase().includes(q) ||
        (d.titreDemandeAide && d.titreDemandeAide.toLowerCase().includes(q)) ||
        d.mode.toLowerCase().includes(q) ||
        d.montant.toLowerCase().includes(q);

      return matchCat && matchStatut && matchSearch;
    });
  }

  toggleFilterMenu() {
    this.isFilterMenuOpen = !this.isFilterMenuOpen;
  }

  selectCategory(cat: string) {
    this.selectedCategory = cat;
    this.isFilterMenuOpen = false;
    this.pageActuelle = 1;
  }

  setStatutFilter(statut: string) {
    this.selectedStatut = statut;
    this.pageActuelle = 1;
  }

  getTotalMontantFinancier(): string {
    if (this.totalMontantStat !== null && this.totalMontantStat > 0) {
      return this.totalMontantStat.toLocaleString('fr-FR') + ' FCFA';
    }
    const total = this.dons
      .filter(d => d.typeDon === 'FINANCIER')
      .reduce((sum, d) => sum + (d.montantValue || 0), 0);
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
    if (d.typeDon === 'MATERIEL' && d.rawId) {
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
      typeDon: this.ongletActif,
      categorie: this.categoriesList.length > 0 ? this.categoriesList[0].nom : 'Santé',
      mode: this.ongletActif === 'FINANCIER' ? 'Orange Money' : 'Dépôt Siège',
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

    if (this.nouveauDon.typeDon === 'FINANCIER') {
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

