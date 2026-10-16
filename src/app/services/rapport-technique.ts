
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RapportTechnique } from '../models/etude.model';

@Injectable({
  providedIn: 'root',
})
export class RapportTechniqueService {

  private http = inject(HttpClient);

  private url = 'http://localhost:8080/api/rapports-techniques';

  EtudeTerrainParRapport(rapportBesoinId: number): Observable<RapportTechnique> {
    return this.http.get<RapportTechnique>(
      `${this.url}/rapport-besoin/${rapportBesoinId}`
    );
  }
}
