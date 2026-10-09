import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TypeJustificatif } from '../models/type-justificatif.models';

@Injectable({
  providedIn: 'root'
})
export class TypeJustificatifService {

  private http = inject(HttpClient);

  private url =
    'http://localhost:8080/api/types-justificatif';

  getAll(): Observable<TypeJustificatif[]> {

    return this.http.get<TypeJustificatif[]>(
      this.url
    );
  }
}