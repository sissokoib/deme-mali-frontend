
export interface AttributionDon {
  id: number;
  donId: number;
  typeDon: string;
  organisationPartenaireId: number;
  nomOrganisation: string;
  dateAttribution: string;
  montantAttribue: number | null;
  quantiteAttribuee: number | null;
  motif: string;
  designation?: string;
}
