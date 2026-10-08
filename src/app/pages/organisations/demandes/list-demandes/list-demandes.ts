
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Demande } from '../../../../models/demande.model';
import { demandeAideService } from '../../../../services/demande-aide';
import { Router } from '@angular/router';

@Component({
  selector: 'app-list-demandes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './list-demandes.html',
  styleUrl: './list-demandes.css'
})
export class ListDemandes {

  demandes: Demande[] = [];
  demandesFiltrees: Demande[] = [];

  recherche = '';
  categorieSelectionnee = '';
  urgenceSelectionnee = '';
  statutSelectionne = '';

  totalDemandes = 0;
  demandesRefusees = 0;
  demandesAttente = 0;
  demandesTraitees = 0;

  constructor(
    private demandeAideService: demandeAideService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.chargerDemandes();
  }

  chargerDemandes(): void {
    this.demandeAideService.getDemandes().subscribe({
      next: (data) => {
        this.demandes = data;
        this.demandesFiltrees = data;
        this.calculerStatistiques();
      },
      error: (error) => {
        console.error(error);
      }
    });
  }

  calculerStatistiques(): void {
    this.totalDemandes = this.demandes.length;

    this.demandesRefusees = this.demandes.filter(
      demande => demande.statut === 'REJETEE'
    ).length;

    this.demandesAttente = this.demandes.filter(
      demande => demande.statut === 'EN_ATTENTE'
    ).length;

    this.demandesTraitees = this.demandes.filter(
      demande =>
        demande.statut === 'VALIDEE' ||
        demande.statut === 'PUBLIEE'
    ).length;
  }

  filtrer(): void {
    this.demandesFiltrees = this.demandes.filter(demande => {

      const recherche = this.recherche.toLowerCase();

      const correspondRecherche =
        demande.titre.toLowerCase().includes(recherche) ||
        demande.beneficiaire?.nom?.toLowerCase().includes(recherche) ||
        demande.beneficiaire?.prenom?.toLowerCase().includes(recherche);

      const correspondCategorie =
        !this.categorieSelectionnee ||
        demande.categorie?.nom === this.categorieSelectionnee;

      const correspondUrgence =
        !this.urgenceSelectionnee ||
        demande.niveauUrgence === this.urgenceSelectionnee;

      const correspondStatut =
        !this.statutSelectionne ||
        demande.statut === this.statutSelectionne;

      return (
        correspondRecherche &&
        correspondCategorie &&
        correspondUrgence &&
        correspondStatut
      );
    });
  }

  nouvelleDemande(): void {
    this.router.navigate(['/organisation/demandes-aide/nouvelle']);
  }

  voirDemande(id: number): void {
    this.router.navigate(['/organisation/demandes-aide', id]);
  }

  getClasseStatut(statut: string): string {
    switch (statut) {
      case 'EN_ATTENTE':
        return 'attente';

      case 'VALIDEE':
        return 'validee';

      case 'REJETEE':
        return 'rejetee';

      case 'PUBLIEE':
        return 'publiee';

      default:
        return '';
    }
  }

  getClasseUrgence(urgence: string): string {
    switch (urgence) {
      case 'ELEVE':
        return 'elevee';

      case 'MOYEN':
        return 'moyenne';

      case 'FAIBLE':
        return 'faible';

      default:
        return '';
    }
  }
}
