import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { EtudeTerrain } from '../models/etude-terrain.model';

@Injectable({
  providedIn: 'root'
})
export class EtudeTerrainService {

  private apiUrl = 'http://localhost:8080/api/etudes-terrain';

  constructor(private http: HttpClient) {}

  getEtudesParOrganisation(
    organisationId: number
  ): Observable<EtudeTerrain[]> {
    return this.http.get<EtudeTerrain[]>(
      `${this.apiUrl}/organisation/${organisationId}`
    );
  }

  getEtudeById(id: number): Observable<EtudeTerrain> {
    return this.http.get<EtudeTerrain>(
      `${this.apiUrl}/${id}`
    );
  }

  creerEtude(dto: Partial<EtudeTerrain>): Observable<EtudeTerrain> {
    return this.http.post<EtudeTerrain>(this.apiUrl, dto);
  }

  planifierEtude(
    id: number,
    dto: Partial<EtudeTerrain>
  ): Observable<EtudeTerrain> {
    return this.http.put<EtudeTerrain>(
      `${this.apiUrl}/${id}/planifier`,
      dto
    );
  }

  terminerEtude(
    id: number,
    dto: Partial<EtudeTerrain>
  ): Observable<EtudeTerrain> {
    return this.http.put<EtudeTerrain>(
      `${this.apiUrl}/${id}/terminer`,
      dto
    );
  }
  
  // Modifier une étude de terrain
  modifier(
    id: number,
    dto: Partial<EtudeTerrain>
  ): Observable<EtudeTerrain> {
    return this.http.put<EtudeTerrain>(
      `${this.apiUrl}/${id}`,
      dto
    );
  }
  
getEtudesParDemande(
  demandeAideId: number
): Observable<EtudeTerrain[]> {
  return this.http.get<EtudeTerrain[]>(
    `${this.apiUrl}/demande/${demandeAideId}`
  );
}
getByDemande(demandeAideId: number): Observable<EtudeTerrain[]> {
  return this.http.get<EtudeTerrain[]>(
    `${this.apiUrl}/demande/${demandeAideId}`
  );
}

  
}