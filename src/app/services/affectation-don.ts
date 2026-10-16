
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  AffectationFinanciere,
  AffectationMaterielle,
  AffectationDonRequest,
  AffectationDonMaterielRequest
} from '../models/affectation-don.model';

@Injectable({
  providedIn: 'root'
})
export class AffectationDonService {

  private apiFinancier =
    'http://localhost:8080/api/affectations-dons';

  private apiMateriel =
    'http://localhost:8080/api/affectations-dons-materiels';

  constructor(private http: HttpClient) {}

  // Récupérer les affectations financières
  getAffectationsFinancieres():
    Observable<AffectationFinanciere[]> {
    return this.http.get<AffectationFinanciere[]>(
      this.apiFinancier
    );
  }

  // Récupérer les affectations matérielles
  getAffectationsMaterielles():
    Observable<AffectationMaterielle[]> {
    return this.http.get<AffectationMaterielle[]>(
      this.apiMateriel
    );
  }

  // Créer une affectation financière
  creer(
    demande: AffectationDonRequest,
    organisationPartenaireId: number
  ): Observable<AffectationFinanciere> {
    return this.http.post<AffectationFinanciere>(
      `${this.apiFinancier}?organisationPartenaireId=${organisationPartenaireId}`,
      demande
    );
  }

  // Créer une affectation matérielle
  creerMaterielle(
    demande: AffectationDonMaterielRequest,
    organisationPartenaireId: number
  ): Observable<AffectationMaterielle> {
    return this.http.post<AffectationMaterielle>(
      `${this.apiMateriel}?organisationPartenaireId=${organisationPartenaireId}`,
      demande
    );
  }
}
