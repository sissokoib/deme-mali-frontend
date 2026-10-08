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
    DatePipe,
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
    demandesAttente: 8,
    etudesRealiser: 5,
    projetsLances: 3,
    aidesDistribuees: 18
  };

  impactStats: ImpactStats = {
    beneficiaires: 156,
    demandesTraitees: 42,
    projets: 12,
    montantFCFA: '4,8M'
  };

  repartition: RepartitionItem[] = [
    { label: 'Alimentaire', percent: 32, color: '#117b48' },
    { label: 'Médical', percent: 24, color: '#117b48' },
    { label: 'Scolaire', percent: 18, color: '#fdba12' },
    { label: 'Logement', percent: 14, color: '#fdba12' }
  ];

  recentDemandes: RecentDemande[] = [
    { nom: 'Aide alimentaire pour famille', beneficiaire: 'Famille Traoré', categorie: 'Alimentaire', urgence: 'Élevée', urgenceClass: 'db-badge-warning', statut: 'En attente', statutClass: 'db-badge-light-warning' },
    { nom: 'Matériel scolaire', beneficiaire: 'École Espoir', categorie: 'Éducation', urgence: 'Moyenne', urgenceClass: 'db-badge-secondary', statut: 'Validée', statutClass: 'db-badge-success' },
    { nom: 'Équipement médical', beneficiaire: 'Centre de santé', categorie: 'Santé', urgence: 'Élevée', urgenceClass: 'db-badge-warning', statut: 'En attente', statutClass: 'db-badge-light-warning' }
  ];

  chartInstance: any;

  ngOnInit(): void {
    this.sub = this.authService.currentUser$.subscribe(utilisateur => {
      this.user = utilisateur;
      this.cdr.detectChanges();
    });

    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.dashboardSub = this.dashboardService.getDashboardStats().subscribe({
      next: (data) => {
        this.kpiStats = data.kpiStats;
        this.impactStats = data.impactStats;
        this.repartition = data.repartition;
        this.recentDemandes = data.recentDemandes;
        
        // Update Chart Data if chart is already initialized
        if (this.chartInstance) {
          this.chartInstance.data.labels = data.chartLabels;
          this.chartInstance.data.datasets[0].data = data.chartDataCollecte;
          this.chartInstance.data.datasets[1].data = data.chartDataDistribue;
          this.chartInstance.update();
        }
        
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des statistiques', error);
        // On error, the dashboard will just keep displaying the default placeholder data
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
      type: 'line',
      data: {
        labels: ['Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept.', 'Oct'],
        datasets: [
          {
            label: 'Collecté',
            data: [250000, 500000, 750000, 1050000, 900000, 1300000, 1600000],
            borderColor: '#117b48',
            backgroundColor: '#117b48',
            borderWidth: 3,
            tension: 0.3,
            pointRadius: 4,
            pointBackgroundColor: '#117b48'
          },
          {
            label: 'Distribué',
            data: [100000, 200000, 350000, 600000, 480000, 800000, 1000000],
            borderColor: '#fdba12',
            backgroundColor: '#fdba12',
            borderWidth: 3,
            tension: 0.3,
            pointRadius: 4,
            pointBackgroundColor: '#fdba12'
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