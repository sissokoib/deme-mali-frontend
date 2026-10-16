import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  AffectationDonMaterielRequest,
  AffectationDonMaterielResponse
} from '../models/affectation-don-materiel.model';

@Injectable({
  providedIn: 'root'
})
export class AffectationDonMaterielService {

  private http = inject(HttpClient);

  private apiUrl =
    'http://localhost:8080/api/affectations-dons-materiels';

  creer(
    dto: AffectationDonMaterielRequest,
    organisationPartenaireId: number
  ): Observable<AffectationDonMaterielResponse> {

    return this.http.post<AffectationDonMaterielResponse>(
      this.apiUrl,
      {
        donMaterielId: dto.donMaterielId,
        demandeAideId: dto.demandeAideId,
        beneficiaireId: dto.beneficiaireId,
        quantiteAffectee: dto.quantiteAffectee,
        organisationPartenaireId: organisationPartenaireId
      }
    );
  }

  getAll(): Observable<AffectationDonMaterielResponse[]> {
    return this.http.get<AffectationDonMaterielResponse[]>(
      this.apiUrl
    );
  }

  getById(
    id: number
  ): Observable<AffectationDonMaterielResponse> {
    return this.http.get<AffectationDonMaterielResponse>(
      `${this.apiUrl}/${id}`
    );
  }

  getByDonMateriel(
    donMaterielId: number
  ): Observable<AffectationDonMaterielResponse[]> {
    return this.http.get<AffectationDonMaterielResponse[]>(
      `${this.apiUrl}/don/${donMaterielId}`
    );
  }


}