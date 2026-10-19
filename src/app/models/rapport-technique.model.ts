
export interface DetailRapportTechnique {
  id?: number;
  designation: string;
  quantite: number;
  unite: string;
  prixUnitaire: number;
  montant: number;
  rapportTechniqueId?: number;
}

export interface RapportTechnique {
  id: number;
  descriptionTechnique: string;
  dateCreation: string;
  rapportBesoinId: number;
  montantFinal: number;
  details: DetailRapportTechnique[];
}

export interface DetailRapportTechniqueRequest {
  designation: string;
  quantite: number;
  unite: string;
  prixUnitaire: number;
}

export interface RapportTechniqueRequest {
  descriptionTechnique: string;
  rapportBesoinId: number;
  montantFinal: number;
  details: DetailRapportTechniqueRequest[];
}
