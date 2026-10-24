export type StatutValidation = 'VALIDEE' | 'EN_ATTENTE' | 'REJETEE';
export type TypeOrganisation = 'ONG' | 'ASSOCIATION' | 'FONDATION';

export interface OrganisationPartenaireResponseDTO {
  id: number;
  nom?: string;
  prenom?: string;
  telephone?: string;
  nomOrganisation: string;
  typeOrganisation: TypeOrganisation;
  nif?: string;
  adresse?: string;
  ville?: string;
  email?: string;
  telephoneOrganisation?: string;
  dateInscription?: string;
  dateCreation?: string;
  statutValidation?: StatutValidation;
  statut?: string;
  documentJustificatif?: string;
}

export interface OrganisationPartenaireRequestDTO {
  nom: string;
  prenom: string;
  telephone: string;
  motDePasse?: string;
  nomOrganisation: string;
  typeOrganisation: TypeOrganisation;
  nif?: string;
  adresse?: string;
  ville?: string;
  email?: string;
  telephoneOrganisation?: string;
}

export type Organisation = OrganisationPartenaireResponseDTO;
