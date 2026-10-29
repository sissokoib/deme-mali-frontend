import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  RapportTechnique,
  RapportTechniqueRequest
} from '../models/rapport-technique.model';

@Injectable({
  providedIn: 'root'
})
export class RapportTechniqueService {

  private readonly apiUrl =
    'http://localhost:8080/api/rapports-techniques';

  constructor(private http: HttpClient) {}

  // Récupérer tous les rapports techniques (GET /api/rapports-techniques)
  getAll(): Observable<RapportTechnique[]> {
    return this.http.get<RapportTechnique[]>(
      this.apiUrl
    );
  }

  // Récupérer un rapport technique par son ID (GET /api/rapports-techniques/{id})
  getById(id: number): Observable<RapportTechnique> {
    return this.http.get<RapportTechnique>(
      `${this.apiUrl}/${id}`
    );
  }

  // Récupérer le rapport technique associé à un rapport de besoin (GET /api/rapports-techniques/rapport-besoin/{rapportBesoinId})
  getByRapportBesoin(
    rapportBesoinId: number
  ): Observable<RapportTechnique> {
    return this.http.get<RapportTechnique>(
      `${this.apiUrl}/rapport-besoin/${rapportBesoinId}`
    );
  }

  // Créer un rapport technique (POST /api/rapports-techniques)
  creer(
    donnees: RapportTechniqueRequest
  ): Observable<RapportTechnique> {
    return this.http.post<RapportTechnique>(
      this.apiUrl,
      donnees
    );
  }

  // Modifier un rapport technique existant (PUT /api/rapports-techniques/{id})
  modifier(
    id: number,
    donnees: RapportTechniqueRequest
  ): Observable<RapportTechnique> {
    return this.http.put<RapportTechnique>(
      `${this.apiUrl}/${id}`,
      donnees
    );
  }

  // Supprimer un rapport technique (DELETE /api/rapports-techniques/{id})
  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );
  }
}
