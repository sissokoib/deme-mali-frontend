import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../models/utilisateur.model';

export interface UtilisateurRequest {
  nom: string;
  prenom: string;
  telephone: string;
  motDePasse?: string;
  role?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UtilisateurService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/utilisateurs';

  getAllUtilisateurs(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  getUtilisateurById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  getUtilisateurByTelephone(telephone: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/telephone/${telephone}`);
  }

  ajouterUtilisateur(request: UtilisateurRequest): Observable<User> {
    return this.http.post<User>(this.apiUrl, request);
  }

  modifierProfil(id: number, utilisateur: any): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, utilisateur);
  }

  supprimerUtilisateur(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/${id}`, { responseType: 'text' });
  }
}
