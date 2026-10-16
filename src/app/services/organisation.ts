
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Organisation } from '../models/organisation.model';


@Injectable({
  providedIn: 'root'
})
export class OrganisationService {

  private apiUrl = 'http://localhost:8080/api/organisations-partenaires';

  constructor(private http: HttpClient) {}

  creerOrganisation(data: any): Observable<Organisation> {
    return this.http.post<Organisation>(this.apiUrl, data);
  }

  getOrganisationById(id: number): Observable<Organisation> {
    return this.http.get<Organisation>(`${this.apiUrl}/${id}`);
  }

  getAllOrganisations(): Observable<Organisation[]> {
    return this.http.get<Organisation[]>(this.apiUrl);
  }

  modifierOrganisation(
    id: number,
    data: any
  ): Observable<Organisation> {
    return this.http.put<Organisation>(
      `${this.apiUrl}/${id}`,
      data
    );
  }

  changerStatut(
    id: number,
    statut: string
  ): Observable<Organisation> {
    return this.http.patch<Organisation>(
      `${this.apiUrl}/${id}/statut`,
      null,
      {
        params: { statut }
      }
    );
  }
}
