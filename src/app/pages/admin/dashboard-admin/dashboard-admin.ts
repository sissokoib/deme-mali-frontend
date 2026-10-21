import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardService } from '../../../services/dashboard.service';
import { demandeAideService } from '../../../services/demande-aide';

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

  // Calendrier dynamique
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
    { day: 18, isCurrentMonth: true, hasTask: true }, // Aujourd'hui
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
    private dashboardService: DashboardService,
    private demandeService: demandeAideService
  ) {}

  ngOnInit() {
    this.chargerStats();
    this.chargerDemandes();
  }

  chargerStats() {
    this.dashboardService.getAdminDashboardStats().subscribe({
      next: (data) => {
        if (data) {
          this.stats = {
            totalOrganisations: data.totalOrganisations || 0,
            totalBeneficiaires: data.totalBeneficiaires || 0,
            totalDemandesAide: data.totalDemandesAide || 0,
            totalDons: data.totalDons || 0,
            montantTotalCollecte: data.montantTotalCollecte || 0,
            demandesEnAttente: data.demandesEnAttente || 0,
            demandesValidees: data.demandesValidees || 0,
            demandesRefusees: data.demandesRefusees || 0
          };
        }
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
            const isValide = d.statut === 'VALIDEE' || d.statut === 'Validé';
            const isTermine = d.statut === 'TERMINEE' || d.statut === 'Terminé';
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
              date: d.dateCreation ? new Date(d.dateCreation).toLocaleDateString('fr-FR') : '16/10/2026',
              priorite: urgence,
              prioriteClass: urgenceClass,
              beneficiaireNom: `${d.beneficiairePrenom || ''} ${d.beneficiaireNom || ''}`.trim() || 'Bénéficiaire',
              beneficiairePhone: '+223 70 00 00 00'
            };
          });

          // Génère les tâches réelles en attente d'action
          this.tasks = demandes
            .filter((d: any) => d.statut === 'EN_ATTENTE' || !d.statut)
            .map((d: any, index: number) => ({
              id: d.id,
              title: `Valider la demande : ${d.titre || 'Demande d\'aide'}`,
              date: d.dateCreation ? new Date(d.dateCreation).toLocaleDateString('fr-FR') : '18 Octobre 2026',
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
      if (this.filterStatut === 'Tous') return true;
      return p.statut.toLowerCase() === this.filterStatut.toLowerCase();
    });
  }

  toggleFilterStatut() {
    if (this.filterStatut === 'Tous') this.filterStatut = 'En cours';
    else if (this.filterStatut === 'En cours') this.filterStatut = 'Validé';
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

