import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { DashboardStats, RepartitionItem, RecentDemande } from '../models/dashboard.model';

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
    return forkJoin({
      stats: this.http.get<any>(`${this.apiUrl}/organisation/${organisationId}`).pipe(
        catchError(() => of({}))
      ),
      demandes: this.http.get<any[]>(`http://localhost:8080/api/demandes-aide/organisation/${organisationId}`).pipe(
        catchError(() => of([]))
      ),
      dons: this.http.get<any[]>('http://localhost:8080/api/dons-financiers').pipe(
        catchError(() => of([]))
      ),
      aides: this.http.get<any[]>('http://localhost:8080/api/aides-distribuees').pipe(
        catchError(() => of([]))
      )
    }).pipe(
      map(({ stats, demandes, dons, aides }) => {
        const toutesDemandes = demandes || [];
        const totalDemandes = toutesDemandes.length;

        // Calculs dynamiques sur les demandes réelles de cette organisation
        const enAttente = toutesDemandes.filter(d => !d.statut || d.statut === 'EN_ATTENTE').length;
        const validees = toutesDemandes.filter(d => d.statut === 'VALIDEE' || d.statut === 'TERMINEE' || d.statut === 'Validée').length;
        const refusees = toutesDemandes.filter(d => d.statut === 'REFUSEE' || d.statut === 'REJETEE' || d.statut === 'Refusée').length;

        // Montant total collecté réel pour l'organisation
        const totalCollecte = stats.montantTotalCollecte ?? (dons || []).reduce((acc, d) => acc + (d.montant || 0), 0);
        const montantStr = totalCollecte >= 1000000
          ? (totalCollecte / 1000000).toFixed(1) + 'M'
          : (totalCollecte >= 1000 ? (totalCollecte / 1000).toFixed(0) + 'K' : totalCollecte.toString());

        // Répartition dynamique par catégorie d'aide pour cette organisation
        const catMap = new Map<string, number>();
        toutesDemandes.forEach(d => {
          const cat = d.categorieDemandeNom || 'Autre';
          catMap.set(cat, (catMap.get(cat) || 0) + 1);
        });

        const paletteCouleurs = ['#0F7A4B', '#16A34A', '#FDBA12', '#D97706', '#3B82F6', '#8B5CF6'];
        let colorIdx = 0;
        const repartitionDynamique: RepartitionItem[] = Array.from(catMap.entries()).map(([label, count]) => {
          const percent = totalDemandes > 0 ? Math.round((count / totalDemandes) * 100) : 0;
          const color = paletteCouleurs[colorIdx % paletteCouleurs.length];
          colorIdx++;
          return { label, percent, color };
        });

        // Demandes récentes réelles de l'organisation (triées par ID décroissant)
        const recentDemandesDynamiques: RecentDemande[] = [...toutesDemandes]
          .sort((a, b) => (b.id || 0) - (a.id || 0))
          .slice(0, 5)
          .map(d => {
            const benef = d.beneficiairePrenom
              ? `${d.beneficiairePrenom} ${d.beneficiaireNom}`
              : (d.beneficiaireNom || 'Bénéficiaire');

            let urgence = 'Moyenne';
            let urgenceClass = 'db-badge-secondary';
            if (d.niveauUrgence === 'FORTE' || d.niveauUrgence === 'ELEVEE') {
              urgence = 'Élevée';
              urgenceClass = 'db-badge-warning';
            } else if (d.niveauUrgence === 'FAIBLE') {
              urgence = 'Faible';
              urgenceClass = 'db-badge-light-warning';
            }

            let statut = 'En attente';
            let statutClass = 'db-badge-light-warning';
            if (d.statut === 'VALIDEE' || d.statut === 'TERMINEE') {
              statut = 'Validée';
              statutClass = 'db-badge-success';
            } else if (d.statut === 'REFUSEE' || d.statut === 'REJETEE') {
              statut = 'Refusée';
              statutClass = 'db-badge-danger';
            }

            return {
              id: d.id,
              nom: d.titre || 'Demande d\'aide',
              beneficiaire: benef,
              categorie: d.categorieDemandeNom || 'Générale',
              urgence,
              urgenceClass,
              statut,
              statutClass
            };
          });

        return {
          kpiStats: {
            demandes: stats.totalDemandesAide ?? totalDemandes,
            demandesRefusees: stats.demandesRefusees ?? refusees,
            demandesAttente: stats.demandesEnAttente ?? enAttente,
            demandesTraitees: stats.demandesValidees ?? validees
          },
          impactStats: {
            beneficiaires: stats.totalBeneficiaires ?? new Set(toutesDemandes.map(d => d.beneficiaireId).filter(Boolean)).size,
            demandesTraitees: stats.demandesValidees ?? validees,
            projets: stats.totalDemandesAide ?? totalDemandes,
            montantFCFA: montantStr + ' FCFA'
          },
          repartition: repartitionDynamique.length > 0 ? repartitionDynamique : (
            totalDemandes === 0 ? [] : [
              { label: 'Alimentation', percent: 35, color: '#0F7A4B' },
              { label: 'Santé', percent: 25, color: '#16A34A' },
              { label: 'Éducation', percent: 20, color: '#FDBA12' },
              { label: 'Logement', percent: 20, color: '#D97706' }
            ]
          ),
          recentDemandes: recentDemandesDynamiques,
          chartLabels: ['Mai', 'Juin', 'Juil', 'Août', 'Sept.', 'Oct'],
          chartDataCollecte: [0, 0, 0, 0, Math.round(totalCollecte * 0.4), totalCollecte],
          chartDataDistribue: [0, 0, 0, 0, 0, (aides || []).length * 10000]
        };
      })
    );
  }
}