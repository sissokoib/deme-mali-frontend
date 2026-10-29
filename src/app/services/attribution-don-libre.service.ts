
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  AttributionDonLibre,
  AttributionDonLibreRequest,
  OrganisationPrioritaireResponse
} from '../models/attribution-don-libre.model';

@Injectable({
  providedIn: 'root'
})
export class AttributionDonLibreService {

  private apiUrl = 'http://localhost:8080/api/attributions-dons-libres';

  constructor(private http: HttpClient) {}

  // Récupérer toutes les attributions de dons libres (Admin)
  getAll(): Observable<AttributionDonLibre[]> {
    return this.http.get<AttributionDonLibre[]>(this.apiUrl);
  }

  // Récupérer les attributions d'une organisation
  getParOrganisation(
    organisationId: number
  ): Observable<AttributionDonLibre[]> {
    return this.http.get<AttributionDonLibre[]>(
      `${this.apiUrl}/organisation/${organisationId}`
    );
  }

  // Récupérer une attribution par son identifiant
  getById(id: number): Observable<AttributionDonLibre> {
    return this.http.get<AttributionDonLibre>(
      `${this.apiUrl}/${id}`
    );
  }

  // Attribuer un don libre (Admin)
  attribuer(
    dto: AttributionDonLibreRequest,
    administrateurId: number
  ): Observable<AttributionDonLibre> {
    return this.http.post<AttributionDonLibre>(
      this.apiUrl,
      dto,
      {
        params: { administrateurId: administrateurId.toString() }
      }
    );
  }

  // Trouver l'organisation prioritaire recommandée par l'algorithme backend
  trouverOrganisationPrioritaire(
    donFinancierId?: number | null,
    donMaterielId?: number | null
  ): Observable<OrganisationPrioritaireResponse> {
    const params: Record<string, string> = {};
    if (donFinancierId != null) {
      params['donFinancierId'] = donFinancierId.toString();
    }
    if (donMaterielId != null) {
      params['donMaterielId'] = donMaterielId.toString();
    }
    return this.http.get<OrganisationPrioritaireResponse>(
      `${this.apiUrl}/organisation-prioritaire`,
      { params }
    );
  }
}

