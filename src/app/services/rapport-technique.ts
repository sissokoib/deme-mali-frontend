
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

  // Récupérer un rapport technique par son ID
  getById(id: number): Observable<RapportTechnique> {
    return this.http.get<RapportTechnique>(
      `${this.apiUrl}/${id}`
    );
  }

  // Récupérer le rapport technique associé à un rapport de besoin
  getByRapportBesoin(
    rapportBesoinId: number
  ): Observable<RapportTechnique> {
    return this.http.get<RapportTechnique>(
      `${this.apiUrl}/rapport-besoin/${rapportBesoinId}`
    );
  }

  // Créer un rapport technique
  creer(
    donnees: RapportTechniqueRequest
  ): Observable<RapportTechnique> {
    return this.http.post<RapportTechnique>(
      this.apiUrl,
      donnees
    );
  }

  // Modifier un rapport technique existant
  modifier(
    id: number,
    donnees: RapportTechniqueRequest
  ): Observable<RapportTechnique> {
    return this.http.put<RapportTechnique>(
      `${this.apiUrl}/${id}`,
      donnees
    );
  }
  
}
