export interface EtudeTerrain {
  id: number;
  dateRealisation: string | null;
  datePlanification: string | null;
  lieu: string;
  objectif: string;
  observation: string | null;
  resultat: string | null;
  heure: string | null;
  status: 'EN_ATTENTE' | 'PLANIFIEE' | 'TERMINEE';
  demandeAideId: number;
  organisationPartenaireId: number;
}