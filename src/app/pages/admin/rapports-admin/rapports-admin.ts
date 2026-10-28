import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { RapportBesoinService } from '../../../services/rapport-bessoin';
import { RapportTechniqueService } from '../../../services/rapport-technique';

export interface RapportItem {
  id: string;
  rawId?: number;
  rawType: 'BESOIN' | 'TECHNIQUE' | 'ETUDE';
  nom: string;
  type: string;
  typeClass: string;
  projet: string;
  periode: string;
  statut: string;
  statutClass: string;
  dateGeneration: string;
  totalMontant?: string;
  beneficiairesTouches?: number;
  description?: string;
}

@Component({
  selector: 'app-rapports-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rapports-admin.html',
  styleUrl: './rapports-admin.css',
})
export class RapportsAdmin implements OnInit {
  filtrePeriode = 'Toutes les périodes';
  filtreType = 'Tous les types';
  filtreStatut = 'Tous les statuts';
  searchTerm = '';
  isLoading = false;

  rapportSelectionne: RapportItem | null = null;
  rapports: RapportItem[] = [];

  constructor(
    private rapportBesoinService: RapportBesoinService,
    private rapportTechniqueService: RapportTechniqueService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.chargerRapports();
  }

  chargerRapports() {
    this.isLoading = true;
    forkJoin({
      besoins: this.rapportBesoinService.getAll().pipe(catchError(() => of([]))),
      techniques: this.rapportTechniqueService.getAll().pipe(catchError(() => of([]))),
      etudes: this.http.get<any[]>('http://localhost:8080/api/etudes-terrain').pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ besoins, techniques, etudes }) => {
        this.isLoading = false;

        // 1. Rapports de Besoins (GET /api/rapports-besoin)
        const rapportsBesoins: RapportItem[] = (besoins || []).map((r: any) => ({
          id: 'RAP-BES-' + String(r.id).padStart(3, '0'),
          rawId: r.id,
          rawType: 'BESOIN',
          nom: r.titre || 'Évaluation des besoins',
          type: 'Besoins',
          typeClass: 'badge-verif',
          projet: r.solutionProposee ? (r.solutionProposee.length > 40 ? r.solutionProposee.slice(0, 40) + '...' : r.solutionProposee) : 'Évaluation terrain',
          periode: r.dateCreation ? new Date(r.dateCreation).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : 'Période en cours',
          statut: 'Publié',
          statutClass: 'status-publie',
          dateGeneration: r.dateCreation ? new Date(r.dateCreation).toLocaleDateString('fr-FR') : '15/10/2026',
          totalMontant: r.montantEstime ? `${(r.montantEstime || 0).toLocaleString('fr-FR')} FCFA` : 'Non chiffré',
          beneficiairesTouches: 1,
          description: r.descriptionSituation || r.besoinIdentifie || 'Rapport officiel d\'évaluation des besoins sur le terrain.'
        }));

        // 2. Rapports Techniques (GET /api/rapports-techniques)
        const rapportsTech: RapportItem[] = (techniques || []).map((t: any) => ({
          id: 'RAP-TEC-' + String(t.id).padStart(3, '0'),
          rawId: t.id,
          rawType: 'TECHNIQUE',
          nom: t.titre || 'Rapport technique d\'intervention',
          type: 'Technique',
          typeClass: 'badge-aides',
          projet: 'Suivi technique terrain',
          periode: t.dateCreation ? new Date(t.dateCreation).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : 'Période en cours',
          statut: 'Publié',
          statutClass: 'status-publie',
          dateGeneration: t.dateCreation ? new Date(t.dateCreation).toLocaleDateString('fr-FR') : '15/10/2026',
          totalMontant: t.montantFinal ? `${(t.montantFinal || 0).toLocaleString('fr-FR')} FCFA` : 'Sur site',
          beneficiairesTouches: 1,
          description: t.descriptionTechnique || t.description || 'Rapport d\'expertise et de faisabilité technique suite à l\'étude terrain.'
        }));

        // 3. Études de Terrain (GET /api/etudes-terrain)
        const rapportsEtudes: RapportItem[] = (etudes || []).map((e: any) => ({
          id: 'ETD-TER-' + String(e.id).padStart(3, '0'),
          rawId: e.id,
          rawType: 'ETUDE',
          nom: `Étude terrain : ${e.lieu || 'Zone ciblée'}`,
          type: 'Étude terrain',
          typeClass: 'badge-dons',
          projet: e.objectif || 'Mission d\'évaluation',
          periode: e.dateRealisation ? new Date(e.dateRealisation).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : 'Période en cours',
          statut: e.status === 'TERMINEE' ? 'Publié' : (e.status === 'PLANIFIEE' ? 'Planifiée' : 'En attente'),
          statutClass: e.status === 'TERMINEE' ? 'status-publie' : 'status-attente',
          dateGeneration: e.dateRealisation ? new Date(e.dateRealisation).toLocaleDateString('fr-FR') : (e.datePlanification ? new Date(e.datePlanification).toLocaleDateString('fr-FR') : 'En cours'),
          totalMontant: 'Mission de terrain',
          beneficiairesTouches: 1,
          description: e.resultat || e.observation || e.objectif || 'Étude de terrain réalisée par l\'organisation partenaire.'
        }));

        this.rapports = [...rapportsBesoins, ...rapportsTech, ...rapportsEtudes];
      },
      error: (err: any) => {
        this.isLoading = false;
        this.rapports = [];
        console.warn('Erreur chargement des rapports backend', err);
      }
    });
  }

  get rapportsFiltres(): RapportItem[] {
    return this.rapports.filter(r => {
      const matchPeriode = this.filtrePeriode === 'Toutes les périodes' || r.periode === this.filtrePeriode;
      const matchType = this.filtreType === 'Tous les types' || r.type === this.filtreType;
      const matchStatut = this.filtreStatut === 'Tous les statuts' || r.statut === this.filtreStatut;
      const matchSearch = !this.searchTerm.trim() ||
        r.nom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        r.projet.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        r.id.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        r.periode.toLowerCase().includes(this.searchTerm.toLowerCase());

      return matchPeriode && matchType && matchStatut && matchSearch;
    });
  }

  // Pagination (10 par page)
  pageActuelle: number = 1;
  elementsParPage: number = 10;

  get totalPages(): number {
    return Math.ceil(this.rapportsFiltres.length / this.elementsParPage) || 1;
  }

  get pages(): number[] {
    const arr: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      arr.push(i);
    }
    return arr;
  }

  get rapportsPaginees(): RapportItem[] {
    const startIndex = (this.pageActuelle - 1) * this.elementsParPage;
    return this.rapportsFiltres.slice(startIndex, startIndex + this.elementsParPage);
  }

  allerPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.pageActuelle = page;
    }
  }

  pagePrecedente() {
    if (this.pageActuelle > 1) {
      this.pageActuelle--;
    }
  }

  pageSuivante() {
    if (this.pageActuelle < this.totalPages) {
      this.pageActuelle++;
    }
  }

  filtrerParType(type: string) {
    this.pageActuelle = 1;
    if (this.filtreType === type) {
      this.filtreType = 'Tous les types';
    } else {
      this.filtreType = type;
    }
  }

  reinitialiserFiltres() {
    this.pageActuelle = 1;
    this.filtrePeriode = 'Toutes les périodes';
    this.filtreType = 'Tous les types';
    this.filtreStatut = 'Tous les statuts';
    this.searchTerm = '';
  }

  voirRapport(rapport: RapportItem) {
    this.rapportSelectionne = rapport;
  }

  fermerDetails() {
    this.rapportSelectionne = null;
  }

  supprimerRapport(r: RapportItem) {
    if (!r.rawId || !confirm(`Voulez-vous vraiment supprimer le rapport ${r.nom} ?`)) {
      return;
    }

    if (r.rawType === 'BESOIN') {
      this.rapportBesoinService.supprimer(r.rawId).subscribe({
        next: () => {
          this.fermerDetails();
          this.chargerRapports();
        },
        error: () => this.chargerRapports()
      });
    } else if (r.rawType === 'TECHNIQUE') {
      this.rapportTechniqueService.supprimer(r.rawId).subscribe({
        next: () => {
          this.fermerDetails();
          this.chargerRapports();
        },
        error: () => this.chargerRapports()
      });
    }
  }

  imprimerRapport() {
    window.print();
  }
}
