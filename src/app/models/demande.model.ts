export interface Demande {

  id: number;

  titre: string;

  beneficiaire: string;

  categorie: string;

  urgence: string;

  date: string;

  statut: string;

  motif?: string;

  description?: string;

  nombrePersonnes?: number;

  montantNecessaire: number;
}
export interface DemandesResponse {

  total: number;

  refusees: number;

  enAttente: number;

  traitees: number;

  demandes: Demande[];
}