
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { RapportBesoin } from '../models/rapport-besoin.model';

@Injectable({
  providedIn: 'root'
})
export class RapportBesoinService {

  private readonly apiUrl =
    'http://localhost:8080/api/rapports-besoin';

  constructor(private http: HttpClient) {}

  // Récupérer un rapport de besoin par son identifiant
  getById(id: number): Observable<RapportBesoin> {
    return this.http.get<RapportBesoin>(
      `${this.apiUrl}/${id}`
    );
  }

  // Récupérer le rapport de besoin associé à une étude
  getByEtudeTerrain(
    etudeTerrainId: number
  ): Observable<RapportBesoin> {
    return this.http.get<RapportBesoin>(
      `${this.apiUrl}/etude-terrain/${etudeTerrainId}`
    );
  }

  // Récupérer tous les rapports de besoin
  getAll(): Observable<RapportBesoin[]> {
    return this.http.get<RapportBesoin[]>(
      this.apiUrl
    );
  }

  // Créer un rapport de besoin
  creer(
    rapport: Partial<RapportBesoin>
  ): Observable<RapportBesoin> {
    return this.http.post<RapportBesoin>(
      this.apiUrl,
      rapport
    );
  }

  // Modifier un rapport de besoin
  modifier(
    id: number,
    rapport: Partial<RapportBesoin>
  ): Observable<RapportBesoin> {
    return this.http.put<RapportBesoin>(
      `${this.apiUrl}/${id}`,
      rapport
    );
  }

  // Supprimer un rapport de besoin
  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );
  }
  
}
