
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { PreuveDistribution, TypeMedia } from '../models/preuve-distribution.model';

@Injectable({
  providedIn: 'root'
})
export class PreuveDistributionService {

  private readonly apiUrl = 'http://localhost:8080/api/preuves-distribution';
  private readonly fichiersUrl = 'http://localhost:8080';

  constructor(private http: HttpClient) {}

  // Ajouter une preuve à une distribution
  ajouter(
    aideDistribueeId: number,
    fichier: File,
    typeMedia: TypeMedia
  ): Observable<PreuveDistribution> {

    const formData = new FormData();
    formData.append('fichier', fichier);
    formData.append('typeMedia', typeMedia);

    return this.http.post<PreuveDistribution>(
      `${this.apiUrl}/distribution/${aideDistribueeId}/televerser`,
      formData
    );
  }

  // Récupérer toutes les preuves d'une distribution
  getByDistribution(
    aideDistribueeId: number
  ): Observable<PreuveDistribution[]> {

    return this.http.get<PreuveDistribution[]>(
      `${this.apiUrl}/distribution/${aideDistribueeId}`
    );
  }

  // Supprimer une preuve
  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Construire l'URL complète d'un fichier enregistré sur le serveur
  getUrlFichier(urlFichier: string): string {
    if (urlFichier.startsWith('http://') || urlFichier.startsWith('https://')) {
      return urlFichier;
    }

    return `${this.fichiersUrl}${urlFichier.startsWith('/') ? '' : '/'}${urlFichier}`;
  }
}
