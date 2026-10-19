import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  Demande,
  DemandeAideRequest
} from '../models/demande.model';

@Injectable({
  providedIn: 'root'
})
export class demandeAideService {

  private apiUrl = 'http://localhost:8080/api/demandes-aide';

  constructor(private http: HttpClient) {}

  getDemandesParOrganisation(
    organisationId: number
  ): Observable<Demande[]> {
    return this.http.get<Demande[]>(
      `${this.apiUrl}/organisation/${organisationId}`
    );
  }

  getDemandes(): Observable<Demande[]> {
    return this.http.get<Demande[]>(this.apiUrl);
  }

  getDemandeById(id: number): Observable<Demande> {
    return this.http.get<Demande>(`${this.apiUrl}/${id}`);
  }

  creerDemande(
    demande: DemandeAideRequest
  ): Observable<Demande> {
    return this.http.post<Demande>(this.apiUrl, demande);
  }

  modifierDemande(
    id: number,
    demande: DemandeAideRequest
  ): Observable<Demande> {
    return this.http.put<Demande>(
      `${this.apiUrl}/${id}`,
      demande
    );
  }

  validerDemande(id: number): Observable<Demande> {
    return this.http.patch<Demande>(
      `${this.apiUrl}/${id}/valider`,
      {}
    );
  }

  rejeterDemande(
    id: number,
    motif: string
  ): Observable<Demande> {
    return this.http.patch<Demande>(
      `${this.apiUrl}/${id}/rejeter`,
      null,
      { params: { motif } }
    );
  }
  getDemandesDisponiblesPourDon(
  organisationId: number
): Observable<Demande[]> {
  return this.http.get<Demande[]>(
    `${this.apiUrl}/disponibles-pour-don/organisation/${organisationId}`
  );
}

getDemandesTermineesPourAideDistribuee(
  organisationId: number
): Observable<Demande[]> {
  return this.http.get<Demande[]>(
    `${this.apiUrl}/terminees-pour-aide-distribuee/organisation/${organisationId}`
  );
}
  getTermineesPourAideDistribuee(
    organisationId: number
  ): Observable<Demande[]> {
    return this.http.get<Demande[]>(
      `${this.apiUrl}/terminees-pour-aide-distribuee/organisation/${organisationId}`
    );
  }

  // Récupérer une demande par son identifiant.
  getById(id: number): Observable<Demande> {
    return this.http.get<Demande>(
      `${this.apiUrl}/${id}`
    );
  }

}