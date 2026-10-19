export interface ArticleDemande {
  id?: number;
  designation: string;
  quantiteDemandee: number;
  unite: string;
  prixUnitaireEstime: number;
}

export interface ArticleDemandeRequest {
  designation: string;
  quantiteDemandee: number;
  unite: string;
  prixUnitaireEstime: number;
}