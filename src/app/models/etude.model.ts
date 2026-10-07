export enum ResultatEtude {
  EN_ATTENTE = 'En attente',
  PLANIFIER = 'Planifier',
  TERMINER = 'Terminer'
}

export interface EtudeTerrain {
  id?: number;
  dateRealisation: Date;
  datePlanification: Date;
  lieu: string;
  objectif: string;
  observation: string;
  resultat: ResultatEtude;
  heure: string;
  status: string;
}

export interface RapportBesoin {
  id?: number;
  titre: string;
  besoinIdentifie: string;
  descriptionSituation: string;
  solutionProposee: string;
  montantEstime: number;
  dateCreation: Date;
}

export interface DetailRapportTechnique {
  id?: number;
  designation: string;
  quantite: number;
  unite: string;
  prixUnitaire: number;
  montant: number;
}

export interface RapportTechnique {
  id?: number;
  descriptionTechnique: string;
  dateCreation: Date;
  details?: DetailRapportTechnique[];
}
