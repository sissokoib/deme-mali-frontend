import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class JustificatifService {
  private http = inject(HttpClient);
  private url = 'http://localhost:8080/api/justificatifs';

  creerJustificatifs(
    fichiers: File[],
    typeJustificatifId: number,
    demandeAideId: number
  ): Observable<unknown> {
    const formulaire = new FormData();

    fichiers.forEach((fichier) => {
      formulaire.append('fichiers', fichier);
    });

    formulaire.append(
      'typeJustificatifId',
      typeJustificatifId.toString()
    );

    formulaire.append(
      'demandeAideId',
      demandeAideId.toString()
    );

    return this.http.post(this.url, formulaire);
  }

  getByDemande(demandeAideId: number): Observable<unknown[]> {
    return this.http.get<unknown[]>(
      `${this.url}/demande/${demandeAideId}`
    );
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}