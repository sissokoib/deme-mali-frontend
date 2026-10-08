import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Demande,CategorieDemande,Beneficiaire } from '../models/demande.model';
@Injectable({
  providedIn: 'root',
})
export class demandeAideService {
   private apiUrl = 'http://localhost:8080/api/demandes-aide';

  constructor(private http: HttpClient) {}

  getDemandes(): Observable<Demande[]> {
    return this.http.get<Demande[]>(this.apiUrl);
  }

  getDemandeById(id: number): Observable<Demande> {
    return this.http.get<Demande>(`${this.apiUrl}/${id}`);
  }

  creerDemande(demande: any): Observable<Demande> {
    return this.http.post<Demande>(this.apiUrl, demande);
  }

  modifierDemande(id: number, demande: any): Observable<Demande> {
    return this.http.put<Demande>(`${this.apiUrl}/${id}`, demande);
  }

  validerDemande(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/valider`, {});
  }

  rejeterDemande(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/rejeter`, {});
  }

  publierDemande(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/publier`, {});
  }

  getCategories(): Observable<CategorieDemande[]> {
    return this.http.get<CategorieDemande[]>(
      'http://localhost:8080/api/categories-demandes'
    );
  }

  getBeneficiaires(): Observable<Beneficiaire[]> {
    return this.http.get<Beneficiaire[]>(
      'http://localhost:8080/api/beneficiaires'
    );
  }
}
