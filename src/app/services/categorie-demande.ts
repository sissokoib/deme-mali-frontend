import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { CategorieDemande } from '../models/categorie-demande.model';

@Injectable({
  providedIn: 'root'
})
export class CategorieDemandeService {

  private apiUrl = 'http://localhost:8080/api/categories-demande';

  constructor(private http: HttpClient) {}

  getCategories(): Observable<CategorieDemande[]> {
    return this.http.get<CategorieDemande[]>(this.apiUrl);
  }
}