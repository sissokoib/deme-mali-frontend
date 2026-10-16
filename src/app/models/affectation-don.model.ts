
export interface AffectationFinanciere {
  id: number;
  donFinancierId: number;
  demandeAideId: number | null;
  beneficiaireId: number | null;
  organisationPartenaireId: number;
  montantAffecte: number;
  dateAffectation: string;
}

export interface AffectationMaterielle {
  id: number;
  donMaterielId: number;
  designation: string;
  quantiteAffectee: number;
  unite: string;
  dateAffectation: string;
  demandeAideId: number | null;
  beneficiaireId: number | null;
  organisationPartenaireId: number;
}

export interface AffectationDonRequest {
  donFinancierId: number;
  demandeAideId: number | null;
  beneficiaireId: number | null;
  montantAffecte: number;
  organisationPartenaireId: number;
}


export interface AffectationDonMaterielRequest {
  donMaterielId: number;
  demandeAideId?: number | null;
  beneficiaireId?: number | null;
  quantiteAffectee: number;
}
