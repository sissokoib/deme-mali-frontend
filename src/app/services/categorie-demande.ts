import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  Demande,
  CategorieDemande
} from '../models/demande.model';

@Injectable({
  providedIn: 'root'
})
export class demandeAideService {

  private apiUrl =
    'http://localhost:8080/api/demandes-aide';

  private categoriesUrl =
    'http://localhost:8080/api/categories-demande';

  constructor(private http: HttpClient) {}

  getCategories(): Observable<CategorieDemande[]> {
    return this.http.get<CategorieDemande[]>(
      this.categoriesUrl
    );
  }

  getDemandesParOrganisation(
    organisationId: number
  ): Observable<Demande[]> {
    return this.http.get<Demande[]>(
      `${this.apiUrl}/organisation/${organisationId}`
    );
  }
}