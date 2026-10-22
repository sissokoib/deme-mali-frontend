
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ImageDemande } from '../models/image-demande.model';

@Injectable({
  providedIn: 'root'
})
export class ImageDemandeService {

  private readonly apiUrl = 'http://localhost:8080/api/images-demandes';
  private readonly fichiersUrl = 'http://localhost:8080/uploads/images-demandes';

  constructor(private http: HttpClient) {}

  /**
   * Ajouter une image à une demande d'aide.
   */
  ajouterImage(
    demandeAideId: number,
    fichier: File
  ): Observable<ImageDemande> {

    const formData = new FormData();

    formData.append('demandeAideId', demandeAideId.toString());
    formData.append('fichier', fichier);

    return this.http.post<ImageDemande>(
      this.apiUrl,
      formData
    );
  }

  /**
   * Récupérer une image par son identifiant.
   */
  getById(id: number): Observable<ImageDemande> {
    return this.http.get<ImageDemande>(
      `${this.apiUrl}/${id}`
    );
  }

  /**
   * Récupérer les images associées à une demande.
   */
  getByDemande(
    demandeAideId: number
  ): Observable<ImageDemande[]> {

    return this.http.get<ImageDemande[]>(
      `${this.apiUrl}/demande/${demandeAideId}`
    );
  }

  /**
   * Récupérer toutes les images.
   */
  getAll(): Observable<ImageDemande[]> {
    return this.http.get<ImageDemande[]>(
      this.apiUrl
    );
  }

  /**
   * Remplacer l'image existante.
   */
  modifierImage(
    id: number,
    fichier: File
  ): Observable<ImageDemande> {

    const formData = new FormData();
    formData.append('fichier', fichier);

    return this.http.put<ImageDemande>(
      `${this.apiUrl}/${id}/fichier`,
      formData
    );
  }

  /**
   * Supprimer une image.
   */
  supprimerImage(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );
  }

  /**
   * Construire l'URL publique de l'image.
   */
  obtenirUrlImage(cheminFichier: string): string {

    if (!cheminFichier) {
      return '';
    }

    const nomFichier = cheminFichier
      .replace(/\\/g, '/')
      .split('/')
      .pop();

    if (!nomFichier) {
      return '';
    }

    return `${this.fichiersUrl}/${encodeURIComponent(nomFichier)}`;
  }
}
