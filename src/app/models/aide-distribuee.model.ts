
export type StatutAideDistribuee = 'EN_ATTENTE' | 'DISTRIBUEE';

export type ModeDistribution =
  | 'ORANGE_MONEY'
  | 'MOVE_MONEY'
  | 'WAVE'
  | 'ESPECES';

export const MODES_DISTRIBUTION: ModeDistribution[] = [
  'ORANGE_MONEY',
  'MOVE_MONEY',
  'WAVE',
  'ESPECES'
];

export interface AideDistribueeRequest {
  dateDistribution: string;
  montantDistribue: number | null;
  quantiteDistribue: number | null;
  unite: string;
  modeDistribution: ModeDistribution;
  lieuDistribution: string;
  statut: StatutAideDistribuee;
  organisateurId: number;
  demandeAideId: number;
}

export interface AideDistribueeResponse {
  id: number;
  dateDistribution: string;
  montantDistribue: number | null;
  quantiteDistribue: number | null;
  unite: string;
  modeDistribution: ModeDistribution;
  lieuDistribution: string;
  statut: StatutAideDistribuee;
  organisateurId: number;
  demandeAideId: number;
}
