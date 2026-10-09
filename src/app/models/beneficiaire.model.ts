export interface Beneficiaire {
  id: number;
  nom: string;
  prenom: string;
  typeBeneficiaire: string;
  ville: string;
  adresse: string;
  statut: string;
  dateValidation?: string;
  organisationPartenaireId: number;
}