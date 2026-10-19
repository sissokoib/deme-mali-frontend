export interface RapportBesoin {
  id: number;
  titre: string;
  besoinIdentifie: string;
  descriptionSituation: string;
  solutionProposee: string;
  montantEstime: number;
  dateCreation: string;
  etudeTerrainId: number;
  rapportTechniqueId: number | null;
    statutDemande?: string;
}