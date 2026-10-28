
export interface AttributionDonLibre {
  id: number;
  donFinancierId: number | null;
  donMaterielId: number | null;
  designation: string | null;
  montantAttribue: number | null;
  quantiteAttribuee: number | null;
  unite: string | null;
  organisationPartenaireId: number;
  nomOrganisation: string;
  administrateurId: number;
  scorePriorite: number;
  dateAttribution: string;
}

export interface AttributionDonLibreRequest {
  donFinancierId?: number | null;
  donMaterielId?: number | null;
  montantAttribue?: number | null;
  quantiteAttribuee?: number | null;
  organisationPartenaireId: number;
}

export interface OrganisationPrioritaireResponse {
  organisationPartenaireId: number;
  nomOrganisation: string;
  scorePriorite: number;
}

