export interface DonateurResponseDTO {
  id: number;
  nom?: string;
  prenom?: string;
  telephone?: string;
  email?: string;
  pays?: any;
  paysId?: number;
  nomPays?: string;
}

export interface DonateurRequestDTO {
  nom: string;
  prenom: string;
  telephone: string;
  paysId?: number;
}
