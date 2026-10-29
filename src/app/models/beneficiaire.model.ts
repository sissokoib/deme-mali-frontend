export type StatutBeneficiaire = 'ACCEPTE' | 'EN_ATTENTE' | 'REFUSE';
export type TypeBeneficiaire = 'PARTICULIER' | 'STRUCTURE';

export interface Beneficiaire {
  id: number;
  nom?: string;
  prenom?: string;
  telephone?: string;
  typeBeneficiaire: TypeBeneficiaire;
  ville?: string;
  adresse?: string;
  statut: StatutBeneficiaire;
  dateValidation?: string;
  motifRefus?: string;
  dateCreation?: string;
  organisationPartenaire?: any;
  organisationPartenaireId?: number;

  // Champs spécifiques Particulier
  situationMatrimonial?: string;
  typeHandicap?: string;
  nombreEnfants?: number;
  dateNaissance?: string;
  sexe?: string;
  typeBeneficiaireParticulier?: string;
  descriptionSituation?: string;

  // Champs spécifiques Structure
  nina?: string;
  nif?: string;
  email?: string;
  nomStructure?: string;
  documentJustificatif?: string;
}

export interface BeneficiaireParticulier extends Beneficiaire {
  typeBeneficiaire: 'PARTICULIER';
  nom: string;
  prenom: string;
}

export interface BeneficiaireStructure extends Beneficiaire {
  typeBeneficiaire: 'STRUCTURE';
  nomStructure: string;
}

export interface BeneficiaireParticulierRequestDTO {
  nom: string;
  prenom: string;
  telephone: string;
  ville: string;
  adresse: string;
  organisationPartenaireId?: number;
  situationMatrimonial?: string;
  typeHandicap?: string;
  nombreEnfants?: number;
  dateNaissance?: string;
  sexe: string;
  typeBeneficiaireParticulier?: string;
  descriptionSituation?: string;
}

export interface BeneficiaireStructureRequestDTO {
  nomStructure: string;
  telephone: string;
  email?: string;
  ville: string;
  adresse: string;
  nina?: string;
  nif?: string;
  documentJustificatif?: string;
  organisationPartenaireId?: number;
}
