export interface KpiStats {
  demandes: number;
  demandesRefusees: number;
  demandesAttente: number;
  demandesTraitees: number;
}

export interface ImpactStats {
  beneficiaires: number;
  demandesTraitees: number;
  projets: number;
  montantFCFA: string;
}

export interface RepartitionItem {
  label: string;
  percent: number;
  color: string;
}

export interface RecentDemande {
  nom: string;
  beneficiaire: string;
  categorie: string;
  urgence: string;
  urgenceClass: string;
  statut: string;
  statutClass: string;
}

export interface DashboardStats {
  kpiStats: KpiStats;
  impactStats: ImpactStats;
  repartition: RepartitionItem[];
  recentDemandes: RecentDemande[];
  chartLabels: string[];
  chartDataCollecte: number[];
  chartDataDistribue: number[];
}
