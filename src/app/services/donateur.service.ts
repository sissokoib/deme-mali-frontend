import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DonateurRequestDTO, DonateurResponseDTO } from '../models/donateur.model';

@Injectable({
  providedIn: 'root'
})
export class DonateurService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/donateurs';

  getAll(): Observable<DonateurResponseDTO[]> {
    return this.http.get<DonateurResponseDTO[]>(this.apiUrl);
  }

  getById(id: number): Observable<DonateurResponseDTO> {
    return this.http.get<DonateurResponseDTO>(`${this.apiUrl}/${id}`);
  }

  creer(dto: DonateurRequestDTO): Observable<DonateurResponseDTO> {
    return this.http.post<DonateurResponseDTO>(this.apiUrl, dto);
  }

  modifierPays(id: number, paysId: number): Observable<DonateurResponseDTO> {
    return this.http.patch<DonateurResponseDTO>(`${this.apiUrl}/${id}/pays/${paysId}`, {});
  }

  getByPays(paysId: number): Observable<DonateurResponseDTO[]> {
    return this.http.get<DonateurResponseDTO[]>(`${this.apiUrl}/pays/${paysId}`);
  }
}
