import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { TypeJustificatif } from '../models/type-justificatif.models';

@Injectable({
  providedIn: 'root'
})
export class TypeJustificatifService {

  private apiUrl = 'http://localhost:8080/api/types-justificatif';

  constructor(private http: HttpClient) {}

  getTypes(): Observable<TypeJustificatif[]> {
    return this.http.get<TypeJustificatif[]>(this.apiUrl);
  }
}