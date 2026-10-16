
export interface DonFinancier {
  id: number;
  montant: number;
  modePaiement: string;
  dateDon: string;
  anonyme: boolean;
  typeDon: string;
  statut: string;
  donateurId: number | null;
  demandeAideId: number | null;
  titreDemandeAide?: string;
}

export interface DonMateriel {
  id: number;
  designation: string;
  quantite: number;
  unite: string;
  etatMateriel: string;
  statutReception: string;
  quantiteRecue: number;
  adresseLivraison: string;
  dateDon: string;
  anonyme: boolean;
  donateurId: number | null;
  demandeAideId: number | null;
  titreDemandeAide?: string;
}

export interface DonAffiche {
  id: number;
  type: 'FINANCIER' | 'MATERIEL';
  date: string;
  demandeAideId: number | null;
  titreDemandeAide?: string;
  statut: string;
  montant?: number;
  modePaiement?: string;
  designation?: string;
  quantite?: number;
  quantiteRecue?: number;
  unite?: string;
  anonyme: boolean;
}
