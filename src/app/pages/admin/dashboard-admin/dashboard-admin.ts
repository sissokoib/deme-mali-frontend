import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../../services/dashboard.service';

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [CommonModule],
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

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {
    this.dashboardService.getAdminDashboardStats().subscribe({
      next: (data) => {
        this.stats = data;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des stats dashboard admin', err);
      }
    });
  }
}
