import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { demandeAideService } from '../../../services/demande-aide';
import { OrganisationService } from '../../../services/organisation';
import { BeneficiaireService } from '../../../services/beneficiaire';
import { DonService } from '../../../services/don.service.ts';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface DashboardProjetItem {
  id: number;
  nom: string;
  localisation: string;
  type: string;
  statut: string;
  statutClass: string;
  date: string;
  priorite: string;
  prioriteClass: string;
  beneficiaireNom: string;
  beneficiairePhone: string;
}

export interface DashboardTask {
  id: number;
  title: string;
  date: string;
  priority: string;
  priorityClass: string;
  iconBg: string;
  iconColor: string;
  done: boolean;
}

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-admin.html',
  styleUrl: './dashboard-admin.css',
})
export class DashboardAdmin implements OnInit {
  stats: any = {
    totalOrganisations: 0,
    totalBeneficiaires: 0,
    totalDemandesAide: 0,
    totalDons: 0,
    montantTotalCollecte: 0,
    demandesEnAttente: 0,
    demandesValidees: 0,
    demandesRefusees: 0
  };

  selectedPeriod = 'cette semaine';
  filterStatut = 'Tous';
  sortOrder = 'desc';
  selectedCalendarDay = 18;

  calendarDays = [
    { day: 28, isCurrentMonth: false, hasTask: false },
    { day: 29, isCurrentMonth: false, hasTask: false },
    { day: 30, isCurrentMonth: false, hasTask: false },
    { day: 1, isCurrentMonth: true, hasTask: false },
    { day: 2, isCurrentMonth: true, hasTask: false },
    { day: 3, isCurrentMonth: true, hasTask: false },
    { day: 4, isCurrentMonth: true, hasTask: false },
    { day: 5, isCurrentMonth: true, hasTask: false },
    { day: 6, isCurrentMonth: true, hasTask: false },
    { day: 7, isCurrentMonth: true, hasTask: false },
    { day: 8, isCurrentMonth: true, hasTask: false },
    { day: 9, isCurrentMonth: true, hasTask: false },
    { day: 10, isCurrentMonth: true, hasTask: false },
    { day: 11, isCurrentMonth: true, hasTask: false },
    { day: 12, isCurrentMonth: true, hasTask: true },
    { day: 13, isCurrentMonth: true, hasTask: false },
    { day: 14, isCurrentMonth: true, hasTask: false },
    { day: 15, isCurrentMonth: true, hasTask: false },
    { day: 16, isCurrentMonth: true, hasTask: false },
    { day: 17, isCurrentMonth: true, hasTask: false },
    { day: 18, isCurrentMonth: true, hasTask: true },
    { day: 19, isCurrentMonth: true, hasTask: false },
    { day: 20, isCurrentMonth: true, hasTask: false },
    { day: 21, isCurrentMonth: true, hasTask: false },
    { day: 22, isCurrentMonth: true, hasTask: false },
    { day: 23, isCurrentMonth: true, hasTask: false },
    { day: 24, isCurrentMonth: true, hasTask: false },
    { day: 25, isCurrentMonth: true, hasTask: true },
    { day: 26, isCurrentMonth: true, hasTask: false },
    { day: 27, isCurrentMonth: true, hasTask: false },
    { day: 28, isCurrentMonth: true, hasTask: false },
    { day: 29, isCurrentMonth: true, hasTask: false },
    { day: 30, isCurrentMonth: true, hasTask: true },
    { day: 31, isCurrentMonth: true, hasTask: false },
    { day: 1, isCurrentMonth: false, hasTask: false }
  ];

  tasks: DashboardTask[] = [];
  projetsDons: DashboardProjetItem[] = [];

  constructor(
    private demandeService: demandeAideService,
    private organisationService: OrganisationService,
    private beneficiaireService: BeneficiaireService,
    private donService: DonService
  ) {}

  ngOnInit() {
    this.chargerStats();
    this.chargerDemandes();
  }

  chargerStats() {
    forkJoin({
      demandes: this.demandeService.getDemandes().pipe(catchError(() => of([]))),
      organisations: this.organisationService.getAllOrganisations().pipe(catchError(() => of([]))),
      beneficiaires: this.beneficiaireService.trouverTous().pipe(catchError(() => of([]))),
      donsFinanciers: this.donService.getAllDonsFinanciers().pipe(catchError(() => of([]))),
      donsGlobaux: this.donService.getAllDons().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ demandes, organisations, beneficiaires, donsFinanciers, donsGlobaux }) => {
        const montantFinancierTotal = (donsFinanciers || []).reduce((sum: number, d: any) => sum + (d.montant || 0), 0);
        const montantDemandes = (demandes || []).reduce((sum: number, d: any) => sum + (d.montantCollecte || 0), 0);
        const montantTotal = montantFinancierTotal > 0 ? montantFinancierTotal : montantDemandes;

        const enAttente = (demandes || []).filter((d: any) => d.statut === 'EN_ATTENTE' || !d.statut).length;
        const validees = (demandes || []).filter((d: any) => d.statut === 'VALIDEE' || d.statut === 'Validé' || d.statut === 'TERMINEE').length;
        const refusees = (demandes || []).filter((d: any) => d.statut === 'REFUSEE' || d.statut === 'Refusé').length;

        const totalDonsCount = Math.max((donsFinanciers || []).length, (donsGlobaux || []).length);

        this.stats = {
          totalOrganisations: (organisations || []).length,
          totalBeneficiaires: (beneficiaires || []).length,
          totalDemandesAide: (demandes || []).length,
          totalDons: totalDonsCount,
          montantTotalCollecte: montantTotal,
          demandesEnAttente: enAttente,
          demandesValidees: validees,
          demandesRefusees: refusees
        };
      },
      error: (err: any) => {
        console.warn('Erreur chargement des stats dashboard', err);
      }
    });
  }

  chargerDemandes() {
    this.demandeService.getDemandes().subscribe({
      next: (demandes: any[]) => {
        if (demandes && demandes.length > 0) {
          this.projetsDons = demandes.map((d: any) => {
            const raw = (d.statut || '').toUpperCase();
            const isTermine = raw === 'TERMINEE' || raw === 'TERMINE';
            const isValide = raw === 'VALIDEE' || raw === 'VALIDE';
            const statut = isTermine ? 'Terminé' : (isValide ? 'Validé' : 'En attente');
            const statutClass = isTermine || isValide ? 'status-termine' : 'status-attente';

            const urgence = d.niveauUrgence === 'FORTE' ? 'Urgente' : (d.niveauUrgence === 'MOYENNE' ? 'Moyenne' : 'Basse');
            const urgenceClass = d.niveauUrgence === 'FORTE' ? 'priority-urgente' : (d.niveauUrgence === 'MOYENNE' ? 'priority-moyenne' : 'priority-basse');

            return {
              id: d.id,
              nom: d.titre || 'Projet de soutien solidaire',
              localisation: d.motif ? `Région de ${d.motif}` : 'Bamako',
              type: d.categorieDemandeNom || 'Social',
              statut: statut,
              statutClass: statutClass,
              date: d.dateCreation ? new Date(d.dateCreation).toLocaleDateString('fr-FR') : 'Aujourd\'hui',
              priorite: urgence,
              prioriteClass: urgenceClass,
              beneficiaireNom: `${d.beneficiairePrenom || ''} ${d.beneficiaireNom || ''}`.trim() || 'Bénéficiaire',
              beneficiairePhone: '+223 70 00 00 00'
            };
          });

          this.tasks = demandes
            .filter((d: any) => d.statut === 'EN_ATTENTE' || !d.statut)
            .map((d: any, index: number) => ({
              id: d.id,
              title: `Valider la demande : ${d.titre || 'Demande d\'aide'}`,
              date: d.dateCreation ? new Date(d.dateCreation).toLocaleDateString('fr-FR') : 'En attente',
              priority: d.niveauUrgence === 'FORTE' ? 'Urgente' : 'Moyenne',
              priorityClass: d.niveauUrgence === 'FORTE' ? 'priority-urgente' : 'priority-moyenne',
              iconBg: index % 2 === 0 ? '#E2F2E9' : '#FFF9E6',
              iconColor: index % 2 === 0 ? '#0F7A4B' : '#FDBA12',
              done: false
            }));
        } else {
          this.projetsDons = [];
          this.tasks = [];
        }
      },
      error: (err: any) => {
        this.projetsDons = [];
        this.tasks = [];
        console.warn('Erreur chargement des demandes dashboard', err);
      }
    });
  }

  get projetsDonsFiltres(): DashboardProjetItem[] {
    return this.projetsDons.filter(p => {
      const f = this.filterStatut;
      if (!f || f === 'Tous') return true;
      if (f === 'Validé' || f.toLowerCase().includes('valid')) {
        return p.statut === 'Validé';
      }
      if (f === 'En attente' || f.toLowerCase().includes('attente')) {
        return p.statut === 'En attente';
      }
      if (f === 'En cours' || f.toLowerCase().includes('cours')) {
        return p.statut === 'En attente' || p.statut === 'Validé';
      }
      return p.statut.toLowerCase() === f.toLowerCase();
    });
  }

  toggleFilterStatut() {
    if (this.filterStatut === 'Tous') this.filterStatut = 'Validé';
    else if (this.filterStatut === 'Validé') this.filterStatut = 'En attente';
    else this.filterStatut = 'Tous';
  }

  toggleSortDate() {
    this.sortOrder = this.sortOrder === 'desc' ? 'asc' : 'desc';
    this.projetsDons.reverse();
  }

  toggleTask(task: DashboardTask) {
    task.done = !task.done;
  }

  getCompletedTasksPercent(): number {
    if (this.tasks.length === 0) return 0;
    const completed = this.tasks.filter(t => t.done).length;
    return Math.round((completed / this.tasks.length) * 100);
  }

  getCompletedTasksCount(): number {
    return this.tasks.filter(t => t.done).length;
  }

  selectCalendarDay(day: number) {
    this.selectedCalendarDay = day;
  }
}
