
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RapportBesoin } from '../models/etude.model';

@Injectable({
  providedIn: 'root',
})
export class RapportBessoin {

  private http = inject(HttpClient);

  private url = 'http://localhost:8080/api/rapports-besoin';

  EtudeTerrainParRapport(etudeTerrainId: number): Observable<RapportBesoin> {
    return this.http.get<RapportBesoin>(
      `${this.url}/etude-terrain/${etudeTerrainId}`
    );
  }
}
