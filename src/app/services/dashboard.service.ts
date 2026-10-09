import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { DashboardStats } from '../models/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = 'http://localhost:8080/api/dashboard';

  constructor(private http: HttpClient) {}

  getAdminDashboardStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/admin`);
  }

  getDashboardStats(organisationId: number): Observable<DashboardStats> {
    return this.http.get<any>(`${this.apiUrl}/organisation/${organisationId}`).pipe(
      map(backendData => {
        // Mapping des donnes relles du backend vers notre modle visuel (DashboardStats)
        const montantStr = backendData.montantTotalCollecte ? (backendData.montantTotalCollecte >= 1000000 ? (backendData.montantTotalCollecte / 1000000).toFixed(1) + 'M' : (backendData.montantTotalCollecte / 1000) + 'K') : '0M';
        
        return {
          kpiStats: {
            demandes: (backendData.demandesEnAttente || 0) + (backendData.demandesValidees || 0) + (backendData.demandesRefusees || 0),
            demandesRefusees: backendData.demandesRefusees || 0,
            demandesAttente: backendData.demandesEnAttente || 0,
            demandesTraitees: backendData.demandesValidees || 0
          },
          impactStats: {
            beneficiaires: backendData.totalBeneficiaires || 0,
            demandesTraitees: (backendData.demandesValidees || 0) + (backendData.demandesRefusees || 0),
            projets: 12, // Fictif
            montantFCFA: montantStr
          },
          repartition: [
            { label: 'Alimentaire', percent: 32, color: '#117b48' },
            { label: 'Mdical', percent: 24, color: '#117b48' },
            { label: 'Scolaire', percent: 18, color: '#fdba12' },
            { label: 'Logement', percent: 14, color: '#fdba12' }
          ],
          recentDemandes: [
            { nom: 'Aide alimentaire pour famille', beneficiaire: 'Famille Traor', categorie: 'Alimentaire', urgence: 'leve', urgenceClass: 'db-badge-warning', statut: 'En attente', statutClass: 'db-badge-light-warning' },
            { nom: 'Matriel scolaire', beneficiaire: 'cole Espoir', categorie: 'ducation', urgence: 'Moyenne', urgenceClass: 'db-badge-secondary', statut: 'Valide', statutClass: 'db-badge-success' }
          ],
          chartLabels: ['Avr', 'Mai', 'Juin', 'Juil', 'Aot', 'Sept.', 'Oct'],
          chartDataCollecte: [250000, 500000, 750000, 1050000, 900000, 1300000, 1600000],
          chartDataDistribue: [100000, 200000, 350000, 600000, 480000, 800000, 1000000]
        };
      })
    );
  }
}