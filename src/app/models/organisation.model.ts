export interface Organisation {
  id: number;
  nom: string;
  prenom: string;
  telephone: string;
  nomOrganisation: string;
  typeOrganisation: 'ONG'|'ASSOCIATION'|'FONDATION';
  nif: string;
  adresse: string;
  ville: string;
  email: string;
  telephoneOrganisation: string;
  dateCreation: string;
  statut: string;
}

    
