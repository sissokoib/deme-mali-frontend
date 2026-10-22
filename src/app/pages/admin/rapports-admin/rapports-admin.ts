import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

export interface RapportItem {
  id: string;
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

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.chargerRapports();
  }

  chargerRapports() {
    this.isLoading = true;
    this.http.get<any[]>('http://localhost:8080/api/rapports-besoin').subscribe({
      next: (besoins: any[]) => {
        const rapportsBesoins: RapportItem[] = (besoins || []).map((r: any) => ({
          id: 'RAP-BES-' + String(r.id).padStart(3, '0'),
          nom: r.titre || 'Évaluation des besoins',
          type: 'Vérification',
          typeClass: 'badge-verif',
          projet: r.solutionProposee ? r.solutionProposee.slice(0, 40) + '...' : 'Évaluation terrain',
          periode: 'Octobre 2026',
          statut: 'Publié',
          statutClass: 'status-publie',
          dateGeneration: r.dateCreation ? new Date(r.dateCreation).toLocaleDateString('fr-FR') : '15/10/2026',
          totalMontant: `${(r.montantEstime || 0).toLocaleString('fr-FR')} FCFA`,
          beneficiairesTouches: 1,
          description: r.descriptionSituation || r.besoinIdentifie || 'Rapport officiel d\'étude terrain des besoins.'
        }));

        this.http.get<any[]>('http://localhost:8080/api/rapports-techniques').subscribe({
          next: (techniques: any[]) => {
            this.isLoading = false;
            const rapportsTech: RapportItem[] = (techniques || []).map((t: any) => ({
              id: 'RAP-TEC-' + String(t.id).padStart(3, '0'),
              nom: t.titre || 'Rapport technique d\'intervention',
              type: 'Aides',
              typeClass: 'badge-aides',
              projet: 'Suivi technique terrain',
              periode: 'Octobre 2026',
              statut: 'Publié',
              statutClass: 'status-publie',
              dateGeneration: t.dateCreation ? new Date(t.dateCreation).toLocaleDateString('fr-FR') : '15/10/2026',
              totalMontant: 'Sur site',
              beneficiairesTouches: 1,
              description: t.description || 'Rapport d\'expertise et faisabilité technique.'
            }));

            this.rapports = [...rapportsBesoins, ...rapportsTech];
          },
          error: () => {
            this.isLoading = false;
            this.rapports = rapportsBesoins;
          }
        });
      },
      error: (err: any) => {
        this.isLoading = false;
        this.rapports = [];
        console.warn('Erreur chargement des rapports depuis le backend', err);
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
        r.periode.toLowerCase().includes(this.searchTerm.toLowerCase());

      return matchPeriode && matchType && matchStatut && matchSearch;
    });
  }

  filtrerParType(type: string) {
    if (this.filtreType === type) {
      this.filtreType = 'Tous les types';
    } else {
      this.filtreType = type;
    }
  }

  reinitialiserFiltres() {
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

  imprimerRapport() {
    window.print();
  }
}
