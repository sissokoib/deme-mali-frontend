

export interface CategorieDemande {
  id: number;
  nom: string;
}

export interface Demande {
  id: number;

  titre: string;
  descriptionSituation: string;

  niveauUrgence: string;
  statut: string;

  dateCreation: string;
  motif: string;

  nombrePersonne: number;
  montantNecessaire: number;

  dateValidation?: string;

  statutCollecte: string;
  montantCollecte: number;

  typeDemande: string;

  beneficiaireId: number;
  beneficiaireNom: string;
  beneficiairePrenom: string;

  organisationPartenaireId: number;

  categorieDemandeId: number;
  categorieDemandeNom: string;
}