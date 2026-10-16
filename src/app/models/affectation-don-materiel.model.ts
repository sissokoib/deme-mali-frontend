
export interface AffectationDonMaterielRequest {
  donMaterielId: number;
  demandeAideId: number | null;
  beneficiaireId: number | null;
  quantiteAffectee: number;
  unite: string;
  organisationPartenaireId: number;
}
export interface AffectationDonMaterielResponse {
  id: number;
  quantiteAffectee: number;
  valeurAffectee: number;
  dateAffectation: string;
  donMaterielId: number;
  demandeAideId: number | null;
  beneficiaireId: number | null;
  organisationPartenaireId?: number;
}
