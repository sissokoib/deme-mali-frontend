import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { demandeAideService } from '../../../services/demande-aide';

export interface ProjetItem {
  id: string;
  rawId?: number;
  nom: string;
  region: string;
  responsable: string;
  type: string;
  statut: string;
  statutClass: string;
  progression: number;
  budget?: string;
  budgetValue?: number;
}

export interface EtapeItem {
  date: string;
  titre: string;
  statut: 'Planifié' | 'En cours' | 'Confirmé';
}

import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-projets-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './projets-admin.html',
  styleUrl: './projets-admin.css',
})
export class ProjetsAdmin implements OnInit {
  isModalOpen = false;
  searchTerm = '';
  filterStatus = 'Tous';
  projetSelectionne: ProjetItem | null = null;
  isLoading = false;

  nouveauProjet = {
    nom: '',
    region: 'Bamako',
    responsable: '',
    type: 'Santé',
    budget: '',
    statut: 'En cours',
    progression: 20
  };

  projets: ProjetItem[] = [];
  etapes: EtapeItem[] = [];

  constructor(private demandeService: demandeAideService) {}

  ngOnInit() {
    this.chargerDemandes();
  }

  chargerDemandes() {
    this.isLoading = true;
    this.demandeService.getDemandes().subscribe({
      next: (demandes: any[]) => {
        this.isLoading = false;
        if (demandes && demandes.length > 0) {
          this.projets = demandes.map((d: any) => {
            const isTermine = d.statut === 'TERMINEE' || d.statut === 'Terminé';
            const isValide = d.statut === 'VALIDEE' || d.statut === 'Validé';
            const statut = isTermine ? 'Terminé' : (isValide ? 'Validé' : 'En cours');
            const statutClass = isTermine ? 'status-termine' : (isValide ? 'status-valide' : 'status-encours');
            const montant = d.montantNecessaire || 0;
            const progress = isTermine ? 100 : (d.montantCollecte && d.montantNecessaire ? Math.round((d.montantCollecte / d.montantNecessaire) * 100) : 25);
            const resp = (d.beneficiairePrenom && d.beneficiaireNom) ? `${d.beneficiairePrenom} ${d.beneficiaireNom}` : 'Équipe Dèmè Mali';
            const dateStr = d.dateCreation ? new Date(d.dateCreation).toLocaleDateString('fr-FR') : '18/10/2026';

            return {
              id: 'PRJ' + String(d.id).padStart(3, '0'),
              rawId: d.id,
              nom: d.titre || 'Projet d\'aide solidaire',
              region: d.motif ? `Région de ${d.motif}` : 'Bamako',
              responsable: resp,
              type: d.categorieDemandeNom || 'Social',
              statut: statut,
              statutClass: statutClass,
              progression: progress,
              budget: `${montant.toLocaleString('fr-FR')} FCFA`,
              budgetValue: montant,
              date: dateStr
            };
          });

          // Génère les étapes clés directement à partir des projets réels du backend
          this.etapes = this.projets.slice(0, 5).map(p => ({
            date: p.budget || '18/10/2026',
            titre: `Étape: ${p.nom}`,
            statut: p.statut === 'Terminé' ? 'Confirmé' : (p.statut === 'Validé' ? 'Confirmé' : 'En cours')
          }));
        } else {
          this.projets = [];
          this.etapes = [];
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.projets = [];
        this.etapes = [];
        console.warn('Erreur chargement des projets depuis le backend', err);
      }
    });
  }

  get projetsFiltres(): ProjetItem[] {
    return this.projets.filter(p => {
      const matchFilter =
        this.filterStatus === 'Tous' ? true :
        this.filterStatus === 'En cours' ? p.statut === 'En cours' :
        this.filterStatus === 'Clôturé' ? (p.statut === 'Terminé' || p.statut === 'Validé') : true;

      const q = this.searchTerm.trim().toLowerCase();
      const matchSearch = !q ? true :
        p.nom.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.region.toLowerCase().includes(q) ||
        p.responsable.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q);

      return matchFilter && matchSearch;
    });
  }

  setFilterStatus(status: string) {
    this.filterStatus = status;
    this.pageActuelle = 1;
  }

  // Pagination (10 éléments par page)
  pageActuelle = 1;
  elementsParPage = 10;

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.projetsFiltres.length / this.elementsParPage));
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get projetsPagines(): ProjetItem[] {
    const debut = (this.pageActuelle - 1) * this.elementsParPage;
    return this.projetsFiltres.slice(debut, debut + this.elementsParPage);
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

  getCountByStatut(statut: string): number {
    return this.projets.filter(p => p.statut === statut).length;
  }

  getTotalBudget(statutFiltre?: string): string {
    const list = statutFiltre
      ? this.projets.filter(p => p.statut === statutFiltre)
      : this.projets;
    const total = list.reduce((sum, p) => sum + (p.budgetValue || 1000000), 0);
    return total.toLocaleString('fr-FR') + ' FCFA';
  }

  getBudgetClotures(): string {
    const total = this.projets
      .filter(p => p.statut === 'Terminé' || p.statut === 'Validé')
      .reduce((sum, p) => sum + (p.budgetValue || 1000000), 0);
    return total.toLocaleString('fr-FR') + ' FCFA';
  }

  toggleEtapeStatut(etape: EtapeItem) {
    if (etape.statut === 'Planifié') {
      etape.statut = 'En cours';
    } else if (etape.statut === 'En cours') {
      etape.statut = 'Confirmé';
    } else {
      etape.statut = 'Planifié';
    }
  }

  ouvrirDetails(p: ProjetItem) {
    this.projetSelectionne = p;
  }

  fermerDetails() {
    this.projetSelectionne = null;
  }

  ajusterProgression(delta: number) {
    if (!this.projetSelectionne) return;
    let newProg = this.projetSelectionne.progression + delta;
    if (newProg > 100) newProg = 100;
    if (newProg < 0) newProg = 0;
    this.projetSelectionne.progression = newProg;

    if (newProg === 100) {
      this.projetSelectionne.statut = 'Terminé';
      this.projetSelectionne.statutClass = 'status-termine';
    }
  }

  changerStatutProjet(nouveauStatut: 'En cours' | 'Validé' | 'Terminé') {
    if (!this.projetSelectionne) return;
    this.projetSelectionne.statut = nouveauStatut;
    this.projetSelectionne.statutClass =
      nouveauStatut === 'En cours' ? 'status-encours' :
      nouveauStatut === 'Terminé' ? 'status-termine' : 'status-valide';

    if (nouveauStatut === 'Terminé') {
      this.projetSelectionne.progression = 100;
    }
  }

  ouvrirModal() {
    this.nouveauProjet = {
      nom: '',
      region: 'Bamako',
      responsable: '',
      type: 'Santé',
      budget: '',
      statut: 'En cours',
      progression: 20
    };
    this.isModalOpen = true;
  }

  fermerModal() {
    this.isModalOpen = false;
  }

  enregistrerProjet() {
    if (!this.nouveauProjet.nom.trim()) {
      return;
    }

    const nextId = 'PRJ' + String(this.projets.length + 1).padStart(3, '0');
    const statutClass =
      this.nouveauProjet.statut === 'En cours' ? 'status-encours' :
      this.nouveauProjet.statut === 'Terminé' ? 'status-termine' : 'status-valide';

    const rawBudget = parseInt(this.nouveauProjet.budget.replace(/\D/g, ''), 10) || 1200000;

    const item: ProjetItem = {
      id: nextId,
      nom: this.nouveauProjet.nom.trim(),
      region: this.nouveauProjet.region,
      responsable: this.nouveauProjet.responsable.trim() || 'Équipe Projets Dèmè Mali',
      type: this.nouveauProjet.type,
      statut: this.nouveauProjet.statut,
      statutClass: statutClass,
      progression: Number(this.nouveauProjet.progression) || 20,
      budget: rawBudget.toLocaleString('fr-FR') + ' FCFA',
      budgetValue: rawBudget
    };

    this.projets.unshift(item);
    this.isModalOpen = false;
  }
}

