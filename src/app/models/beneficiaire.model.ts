export interface Beneficiaire {
  id: number;
  nom: string;
  prenom: string;
  telephone: string;
  typeBeneficiaire: 'PARTICULIER' | 'STRUCTURE';
  ville: string;
  adresse: string;
  statut: 'ACCEPTE' | 'EN_ATTENTE' | 'REFUSE';
  dateValidation?: string;
  motifRefus?: string;
}
