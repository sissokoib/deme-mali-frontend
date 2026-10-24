import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  DonFinancier,
  DonMateriel,
  DonResponseDTO,
  ComptabiliteDonsResponseDTO
} from '../models/don.model';

@Injectable({
  providedIn: 'root'
})
export class DonService {

  private readonly donsUrl = 'http://localhost:8080/api/dons';
  private readonly financierUrl = 'http://localhost:8080/api/dons-financiers';
  private readonly materielUrl = 'http://localhost:8080/api/dons-materiels';

  constructor(private http: HttpClient) {}

  // ========================================================================
  // 1. DONS GLOBAUX (/api/dons - DonController)
  // ========================================================================

  creerDon(dto: any): Observable<DonResponseDTO> {
    return this.http.post<DonResponseDTO>(this.donsUrl, dto);
  }

  getDonById(id: number): Observable<DonResponseDTO> {
    return this.http.get<DonResponseDTO>(`${this.donsUrl}/${id}`);
  }

  getAllDons(): Observable<DonResponseDTO[]> {
    return this.http.get<DonResponseDTO[]>(this.donsUrl);
  }

  getDonsByDonateur(donateurId: number): Observable<DonResponseDTO[]> {
    return this.http.get<DonResponseDTO[]>(`${this.donsUrl}/donateur/${donateurId}`);
  }

  getDonsByDemande(demandeAideId: number): Observable<DonResponseDTO[]> {
    return this.http.get<DonResponseDTO[]>(`${this.donsUrl}/demande/${demandeAideId}`);
  }

  // ========================================================================
  // 2. DONS FINANCIERS (/api/dons-financiers - DonFinancierController)
  // ========================================================================

  creerDonFinancier(dto: any): Observable<DonFinancier> {
    return this.http.post<DonFinancier>(this.financierUrl, dto);
  }

  getDonFinancierById(id: number): Observable<DonFinancier> {
    return this.http.get<DonFinancier>(`${this.financierUrl}/${id}`);
  }

  getAllDonsFinanciers(): Observable<DonFinancier[]> {
    return this.http.get<DonFinancier[]>(this.financierUrl);
  }

  getDonsFinanciersByDonateur(donateurId: number): Observable<DonFinancier[]> {
    return this.http.get<DonFinancier[]>(`${this.financierUrl}/donateur/${donateurId}`);
  }

  getDonsFinanciersByDemande(demandeAideId: number): Observable<DonFinancier[]> {
    return this.http.get<DonFinancier[]>(`${this.financierUrl}/demande/${demandeAideId}`);
  }

  getTotalDonsStatistiques(): Observable<number> {
    return this.http.get<number>(`${this.financierUrl}/statistiques/total`);
  }

  getTotalDonsAffectesStatistiques(): Observable<number> {
    return this.http.get<number>(`${this.financierUrl}/statistiques/affectes`);
  }

  getTotalDonsGenerauxStatistiques(): Observable<number> {
    return this.http.get<number>(`${this.financierUrl}/statistiques/generaux`);
  }

  getTotalDonsOrganisation(organisationId: number): Observable<number> {
    return this.http.get<number>(`${this.financierUrl}/organisation/${organisationId}/total`);
  }

  getComptabiliteOrganisation(organisationId: number): Observable<ComptabiliteDonsResponseDTO> {
    return this.http.get<ComptabiliteDonsResponseDTO>(`${this.financierUrl}/organisation/${organisationId}/comptabilite`);
  }

  getDonsOrganisation(organisationId: number): Observable<DonFinancier[]> {
    return this.http.get<DonFinancier[]>(`${this.financierUrl}/organisation/${organisationId}`);
  }

  verifierMontantDemande(demandeAideId: number, montant: number): Observable<any> {
    return this.http.get<any>(`${this.financierUrl}/demande/${demandeAideId}/verifier-montant`, {
      params: { montant: montant.toString() }
    });
  }

  // Rétrocompatibilité
  getDonsFinanciers(organisationId: number): Observable<DonFinancier[]> {
    return this.getDonsOrganisation(organisationId);
  }

  // ========================================================================
  // 3. DONS MATÉRIELS (/api/dons-materiels - DonMaterielController)
  // ========================================================================

  creerDonMateriel(dto: any): Observable<DonMateriel> {
    return this.http.post<DonMateriel>(this.materielUrl, dto);
  }

  getDonsMaterielsByDonateur(donateurId: number): Observable<DonMateriel[]> {
    return this.http.get<DonMateriel[]>(`${this.materielUrl}/donateur/${donateurId}`);
  }

  getDonsMaterielsByDemande(demandeAideId: number): Observable<DonMateriel[]> {
    return this.http.get<DonMateriel[]>(`${this.materielUrl}/demande/${demandeAideId}`);
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

  getDonsMaterielsByOrganisation(organisationId: number): Observable<DonMateriel[]> {
    return this.http.get<DonMateriel[]>(`${this.materielUrl}/organisation/${organisationId}`);
  }

  // Rétrocompatibilité
  getDonsMateriels(organisationId: number): Observable<DonMateriel[]> {
    return this.getDonsMaterielsByOrganisation(organisationId);
  }

  getAllDonsMateriels(): Observable<DonMateriel[]> {
    return this.http.get<DonMateriel[]>(this.materielUrl);
  }
}
