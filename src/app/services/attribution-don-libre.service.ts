
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  AttributionDonLibre
} from '../models/attribution-don-libre.model';

@Injectable({
  providedIn: 'root'
})
export class AttributionDonLibreService {

  private apiUrl =
    'http://localhost:8080/api/attributions-dons-libres';

  constructor(private http: HttpClient) {}

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
}
