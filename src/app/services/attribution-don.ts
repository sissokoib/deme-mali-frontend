
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AttributionDon } from '../models/attribution-don.model';

@Injectable({
  providedIn: 'root'
})
export class AttributionDonService {

  private http = inject(HttpClient);

  // URL corrigée selon le contrôleur Spring Boot
  private apiUrl = 'http://localhost:8080/api/attributions-dons-libres';

  getParOrganisation(
    organisationId: number
  ): Observable<AttributionDon[]> {

    return this.http.get<AttributionDon[]>(
      `${this.apiUrl}/organisation/${organisationId}`
    );
  }
}
