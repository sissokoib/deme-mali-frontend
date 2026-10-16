
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
