import { Component, inject, OnInit, OnDestroy, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { DatePipe, CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { DashboardService } from '../../../services/dashboard.service';
import { User } from '../../../models/utilisateur.model';
import { DashboardStats, KpiStats, ImpactStats, RepartitionItem, RecentDemande } from '../../../models/dashboard.model';
import { Subscription } from 'rxjs';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    CommonModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit, OnDestroy, AfterViewInit {
  private readonly authService = inject(AuthService);
  private readonly dashboardService = inject(DashboardService);
  private readonly cdr = inject(ChangeDetectorRef);
  private sub?: Subscription;
  private dashboardSub?: Subscription;

  user: User | null = null;
  currentDate = new Date();

  // Dynamic Stats initialized with default/mock values while loading
  kpiStats: KpiStats = {
    demandes: 0,
    demandesRefusees: 0,
    demandesAttente: 0,
    demandesTraitees: 0
  };

  impactStats: ImpactStats = {
    beneficiaires: 0,
    demandesTraitees: 0,
    projets: 0,
    montantFCFA: '0 FCFA'
  };

  repartition: RepartitionItem[] = [];

  recentDemandes: RecentDemande[] = [];

  chartLabels: string[] = ['Mai', 'Juin', 'Juil', 'Août', 'Sept.', 'Oct'];
  chartDataCollecte: number[] = [0, 0, 0, 0, 0, 0];
  chartDataDistribue: number[] = [0, 0, 0, 0, 0, 0];
  chartInstance: any;

  ngOnInit(): void {
    this.sub = this.authService.currentUser$.subscribe(utilisateur => {
      this.user = utilisateur;
      if (utilisateur?.id) {
        this.loadDashboardData(utilisateur.id);
      }
      this.cdr.detectChanges();
    });

    const userActuel = this.authService.getCurrentUser();
    if (userActuel?.id) {
      this.loadDashboardData(userActuel.id);
    }
  }

  loadDashboardData(organisationId?: number): void {
    const orgId = organisationId || this.user?.id;
    if (!orgId) {
      return;
    }

    if (this.dashboardSub) {
      this.dashboardSub.unsubscribe();
    }

    this.dashboardSub = this.dashboardService.getDashboardStats(orgId).subscribe({
      next: (data) => {
        this.kpiStats = data.kpiStats;
        this.impactStats = data.impactStats;
        this.repartition = data.repartition;
        this.recentDemandes = data.recentDemandes;
        this.chartLabels = data.chartLabels;
        this.chartDataCollecte = data.chartDataCollecte;
        this.chartDataDistribue = data.chartDataDistribue;
        
        // Update Chart Data if chart is already initialized
        if (this.chartInstance) {
          this.chartInstance.data.labels = this.chartLabels;
          this.chartInstance.data.datasets[0].data = this.chartDataCollecte;
          this.chartInstance.data.datasets[1].data = this.chartDataDistribue;
          this.chartInstance.update();
        }
        
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des statistiques de l\'organisation', error);
      }
    });
  }

  ngAfterViewInit(): void {
    this.initChart();
  }

  initChart() {
    const ctx = document.getElementById('evolutionChart') as HTMLCanvasElement;
    if (!ctx) return;

    this.chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.chartLabels,
        datasets: [
          {
            label: 'Collecté',
            data: this.chartDataCollecte,
            borderColor: '#117b48',
            backgroundColor: '#117b48',
            borderWidth: 3
          },
          {
            label: 'Distribué',
            data: this.chartDataDistribue,
            borderColor: '#fdba12',
            backgroundColor: '#fdba12',
            borderWidth: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false // We use custom HTML legend
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const val = context.raw as number;
                return val >= 1000000 ? (val / 1000000).toFixed(1) + 'M' : (val / 1000) + 'K';
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 1800000,
            ticks: {
              callback: (value) => {
                const val = value as number;
                if (val === 0) return '0';
                if (val >= 1000000) return (val / 1000000).toFixed(1).replace('.0', '') + 'M';
                return (val / 1000) + 'K';
              },
              stepSize: 500000
            },
            grid: {
              color: '#f0f0f0'
            },
            border: {
              display: false
            }
          },
          x: {
            grid: {
              display: false
            },
            border: {
              display: false
            }
          }
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.dashboardSub?.unsubscribe();
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
  }
}