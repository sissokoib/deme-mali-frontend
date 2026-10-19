import { ArticleDemande } from './articles-demandes.model';

export interface Demande {
  id: number;

  titre: string;
  descriptionSituation: string;

  niveauUrgence: string;
  statut: string;

  dateCreation: string;
  motif: string;

  nombrePersonne: number;
  montantNecessaire: number | null;

  dateValidation?: string;

  statutCollecte: string;
  montantCollecte: number;

  typeDemande: string;
  typeDemandeAide: 'FINANCIERE' | 'MATERIELLE';

  beneficiaireId: number;
  beneficiaireNom: string;
  beneficiairePrenom: string;

  organisationPartenaireId: number;

  categorieDemandeId: number;
  categorieDemandeNom: string;

  articles: ArticleDemande[];
}

export interface DemandeAideRequest {
  titre: string;
  descriptionSituation: string;
  niveauUrgence: string;
  motif?: string;
  nombrePersonne: number;
  montantNecessaire: number | null;
  beneficiaireId: number;
  organisationPartenaireId: number;
  categorieDemandeId: number;
  typeDemande: string;
  typeDemandeAide: 'FINANCIERE' | 'MATERIELLE';
  articles: ArticleDemande[];
}