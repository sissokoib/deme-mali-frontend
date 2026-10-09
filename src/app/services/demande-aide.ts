import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Demande,
  CategorieDemande,
} from '../models/demande.model';
import { Beneficiaire } from '../models/beneficiaire.model';

@Injectable({
  providedIn: 'root',
})
export class demandeAideService {

  private apiUrl =
    'http://localhost:8080/api/demandes-aide';

  constructor(
    private http: HttpClient
  ) {}

  getDemandesParOrganisation(
    organisationId: number
  ): Observable<Demande[]> {

    return this.http.get<Demande[]>(
      `http://localhost:8080/api/demandes-aide/organisation/${organisationId}`
    );
  }

  getDemandes(): Observable<Demande[]> {

    return this.http.get<Demande[]>(
      this.apiUrl
    );
  }

  getDemandeById(
    id: number
  ): Observable<Demande> {

    return this.http.get<Demande>(
      `${this.apiUrl}/${id}`
    );
  }

  creerDemande(
    demande: any
  ): Observable<Demande> {

    return this.http.post<Demande>(
      this.apiUrl,
      demande
    );
  }

  modifierDemande(
    id: number,
    demande: any
  ): Observable<Demande> {

    return this.http.put<Demande>(
      `${this.apiUrl}/${id}`,
      demande
    );
  }

  validerDemande(
    id: number
  ): Observable<any> {

    return this.http.put(
      `${this.apiUrl}/${id}/valider`,
      {}
    );
  }

  rejeterDemande(
    id: number
  ): Observable<any> {

    return this.http.put(
      `${this.apiUrl}/${id}/rejeter`,
      {}
    );
  }

  publierDemande(
    id: number
  ): Observable<any> {

    return this.http.put(
      `${this.apiUrl}/${id}/publier`,
      {}
    );
  }

  getCategories(): Observable<CategorieDemande[]> {

    return this.http.get<CategorieDemande[]>(
      'http://localhost:8080/api/categories-demande'
    );
  }

  getBeneficiairesParOrganisation(
    organisationId: number
  ): Observable<Beneficiaire[]> {

    return this.http.get<Beneficiaire[]>(
      `http://localhost:8080/api/beneficiaires/organisation/${organisationId}`
    );
  }
}