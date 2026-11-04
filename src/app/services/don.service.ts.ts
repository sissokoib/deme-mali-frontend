
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  DonFinancier,
  DonMateriel
} from '../models/don.model';

@Injectable({
  providedIn: 'root'
})
export class DonService {

  private financierUrl = 'http://localhost:8080/api/dons-financiers';
  private materielUrl = 'http://localhost:8080/api/dons-materiels';

  constructor(private http: HttpClient) {}

  getAllDonsFinanciers(): Observable<DonFinancier[]> {
    return this.http.get<DonFinancier[]>(this.financierUrl);
  }

  getAllDonsMateriels(): Observable<DonMateriel[]> {
    return this.http.get<DonMateriel[]>(this.materielUrl);
  }

  getDonsFinanciers(organisationId: number): Observable<DonFinancier[]> {
    return this.http.get<DonFinancier[]>(
      `${this.financierUrl}/organisation/${organisationId}`
    );
  }

  getDonsMateriels(organisationId: number): Observable<DonMateriel[]> {
    return this.http.get<DonMateriel[]>(
      `${this.materielUrl}/organisation/${organisationId}`
    );
  }

  confirmerReception(donId: number, quantiteRecue: number): Observable<DonMateriel> {
    return this.http.put<DonMateriel>(
      `${this.materielUrl}/${donId}/reception`,
      null,
      { params: { quantiteRecue: quantiteRecue.toString() } }
    );
  }

  refuserDon(donId: number, motifRefus: string): Observable<DonMateriel> {
    return this.http.put<DonMateriel>(
      `${this.materielUrl}/${donId}/refus`,
      null,
      { params: { motifRefus } }
    );
  }
}
