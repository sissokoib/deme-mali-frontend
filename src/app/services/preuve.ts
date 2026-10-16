import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PreuveService {

  private http = inject(HttpClient);

  private apiUrl = 'http://localhost:8080/api/preuves';

  uploaderPreuve(
    aideDistribueeId: number,
    fichier: File
  ): Observable<any> {

    const formData = new FormData();

    formData.append('fichier', fichier);

    return this.http.post(
      `${this.apiUrl}/upload/${aideDistribueeId}`,
      formData
    );
  }
}