import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EtudeTerrain } from '../models/etude.model';

@Injectable({
  providedIn: 'root'
})
export class EtudeTerrainService {

  private apiUrl = 'http://localhost:8080/api/etudes-terrain';
  private demandesUrl = 'http://localhost:8080/api/demandes-aide';

  constructor(private http: HttpClient) { }

  getEtudes(organisationId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/organisation/${organisationId}`).pipe(
      map(backendData => {
        return backendData.map(etude => ({
          id: etude.id,
          demande: {
            id: etude.demandeAideId,
            titre: 'Demande #' + etude.demandeAideId,
            beneficiaire: 'Bnciaire ' + (etude.organisationPartenaireId || '')
          },
          datePlanification: etude.datePlanification,
          dateRealisation: etude.dateRealisation,
          lieu: etude.lieu,
          objectif: etude.objectif,
          observation: etude.observation,
          resultat: etude.resultat,
          status: etude.status // Backend is EN_ATTENTE, PLANIFIEE, TERMINEE
        }));
      })
    );
  }

  planifierEtude(etudeDto: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, etudeDto);
  }

  getDemandes(organisationId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.demandesUrl}/organisation/${organisationId}`);
  }
}