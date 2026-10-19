import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  AideDistribuee,
  AideDistribueeRequest
} from '../models/aide-distribuee.model';

@Injectable({
  providedIn: 'root'
})
export class AideDistribueeService {

  private readonly apiUrl =
    'http://localhost:8080/api/aides-distribuees';

  constructor(private http: HttpClient) {}

  // Récupérer toutes les distributions.
  getAll(): Observable<AideDistribuee[]> {
    return this.http.get<AideDistribuee[]>(this.apiUrl);
  }

  // Récupérer une distribution avec ses informations.
  getById(id: number): Observable<AideDistribuee> {
    return this.http.get<AideDistribuee>(`${this.apiUrl}/${id}`);
  }

  // Créer une distribution.
  creer(dto: AideDistribueeRequest): Observable<AideDistribuee> {
    return this.http.post<AideDistribuee>(this.apiUrl, dto);
  }

  // Récupérer les distributions d'une demande d'aide.
  getByDemande(demandeAideId: number): Observable<AideDistribuee[]> {
    return this.http.get<AideDistribuee[]>(
      `${this.apiUrl}/demande/${demandeAideId}`
    );
  }

  // Récupérer les distributions d'un bénéficiaire.
  getByBeneficiaire(beneficiaireId: number): Observable<AideDistribuee[]> {
    return this.http.get<AideDistribuee[]>(
      `${this.apiUrl}/beneficiaire/${beneficiaireId}`
    );
  }

  // Charger une distribution avec ses affectations financières.
  getAvecAffectationsFinancieres(id: number): Observable<AideDistribuee> {
    return this.http.get<AideDistribuee>(
      `${this.apiUrl}/${id}/affectations-financieres`
    );
  }

  // Charger une distribution avec ses affectations matérielles.
  getAvecAffectationsMaterielles(id: number): Observable<AideDistribuee> {
    return this.http.get<AideDistribuee>(
      `${this.apiUrl}/${id}/affectations-materielles`
    );
  }

  // Confirmer une distribution.
  confirmer(id: number): Observable<AideDistribuee> {
    return this.http.patch<AideDistribuee>(
      `${this.apiUrl}/${id}/confirmer`,
      {}
    );
  }

  // Supprimer une distribution.
  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
  getByOrganisation(
  organisationId: number
): Observable<AideDistribuee[]> {
  return this.http.get<AideDistribuee[]>(
    `${this.apiUrl}/organisation/${organisationId}`
  );
}
}