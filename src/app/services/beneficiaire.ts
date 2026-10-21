import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Beneficiaire } from '../models/beneficiaire.model';
import { AffectationDonMaterielResponse } from '../models/affectation-don-materiel.model';

@Injectable({
  providedIn: 'root'
})
export class BeneficiaireService {

  private http = inject(HttpClient);

  private apiUrl = 'http://localhost:8080/api/beneficiaires';

  getAllBeneficiaires(): Observable<Beneficiaire[]> {
    return this.http.get<Beneficiaire[]>(this.apiUrl);
  }

  trouverParOrganisation(
    organisationId: number
  ): Observable<Beneficiaire[]> {
    return this.http.get<Beneficiaire[]>(
      `${this.apiUrl}/organisation/${organisationId}`
    );
  }

  trouverAcceptesParOrganisation(
    organisationId: number
  ): Observable<Beneficiaire[]> {
    return this.http.get<Beneficiaire[]>(
      `${this.apiUrl}/acceptes/organisation/${organisationId}`
    );
  }

  trouverParId(id: number): Observable<Beneficiaire> {
    return this.http.get<Beneficiaire>(
      `${this.apiUrl}/${id}`
    );
  }

  accepter(id: number): Observable<Beneficiaire> {
    return this.http.put<Beneficiaire>(
      `${this.apiUrl}/${id}/accepter`,
      {}
    );
  }

  refuser(
    id: number,
    motif: string
  ): Observable<Beneficiaire> {
    return this.http.put<Beneficiaire>(
      `${this.apiUrl}/${id}/refuser`,
      {},
      {
        params: { motif }
      }
    );
  }
    getByBeneficiaire(
    beneficiaireId: number
  ): Observable<AffectationDonMaterielResponse[]> {
    return this.http.get<AffectationDonMaterielResponse[]>(
      `${this.apiUrl}/beneficiaire/${beneficiaireId}`
    );
  }
}