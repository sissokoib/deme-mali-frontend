import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import {
  AideDistribueeRequest,
  AideDistribueeResponse
} from '../models/aide-distribuee.model';

@Injectable({
  providedIn: 'root'
})
export class AideDistribueeService {

  private http = inject(HttpClient);

  private apiUrl = 'http://localhost:8080/api/aides-distribuees';

  trouverToutes(): Observable<AideDistribueeResponse[]> {
    return this.http.get<AideDistribueeResponse[]>(this.apiUrl);
  }

  trouverParId(id: number): Observable<AideDistribueeResponse> {
    return this.http.get<AideDistribueeResponse>(`${this.apiUrl}/${id}`);
  }

  creer(aide: AideDistribueeRequest): Observable<AideDistribueeResponse> {
    return this.http.post<AideDistribueeResponse>(this.apiUrl, aide);
  }
}