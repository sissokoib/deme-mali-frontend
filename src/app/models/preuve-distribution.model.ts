
export type TypeMedia = 'IMAGE' | 'VIDEO' | 'DOCUMENT';

export interface PreuveDistribution {
  id: number;
  nomFichier: string;
  urlFichier: string;
  typeMedia: TypeMedia;
}
