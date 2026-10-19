
import { PreuveDistribution } from './preuve-distribution.model';

export type StatutDistribution = 'EN_ATTENTE' | 'DISTRIBUEE';

export interface AffectationDon {
  id: number;
  donFinancierId: number;
  demandeAideId: number | null;
  beneficiaireId: number | null;
  organisationPartenaireId: number;
  montantAffecte: number;
  dateAffectation: string;
}

export interface AffectationDonMateriel {
  id: number;
  donMaterielId: number;
  designation: string;
  quantiteAffectee: number;
  unite: string;
  dateAffectation: string;
  demandeAideId: number | null;
  beneficiaireId: number | null;
  organisationPartenaireId: number | null;
  valeurAffectee?: number;
}

export interface AideDistribuee {
  id: number;
  demandeAideId: number | null;
  beneficiaireId: number | null;
  dateDistribution: string;
  lieuDistribution: string;
  statut: StatutDistribution;
  preuves: PreuveDistribution[];
  affectationsFinancieres: AffectationDon[];
  affectationsMaterielles: AffectationDonMateriel[];
}

export interface AideDistribueeRequest {
  demandeAideId: number|null;
  beneficiaireId?: number|null;
  dateDistribution: string;
  lieuDistribution: string;
}
