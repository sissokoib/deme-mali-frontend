import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Beneficiaire,
  BeneficiaireParticulier,
  BeneficiaireStructure,
  BeneficiaireParticulierRequestDTO,
  BeneficiaireStructureRequestDTO
} from '../models/beneficiaire.model';
import { AffectationDonMaterielResponse } from '../models/affectation-don-materiel.model';

@Injectable({
  providedIn: 'root'
})
export class BeneficiaireService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/beneficiaires';

  // --- Endpoints globaux Bénéficiaires ---
  getAllBeneficiaires(): Observable<Beneficiaire[]> {
    return this.http.get<Beneficiaire[]>(this.apiUrl);
  }

  trouverTous(): Observable<Beneficiaire[]> {
    return this.http.get<Beneficiaire[]>(this.apiUrl);
  }

  trouverEnAttente(): Observable<Beneficiaire[]> {
    return this.http.get<Beneficiaire[]>(`${this.apiUrl}/en-attente`);
  }

  trouverParId(id: number): Observable<Beneficiaire> {
    return this.http.get<Beneficiaire>(`${this.apiUrl}/${id}`);
  }

  trouverParOrganisation(organisationId: number): Observable<Beneficiaire[]> {
    return this.http.get<Beneficiaire[]>(`${this.apiUrl}/organisation/${organisationId}`);
  }

  trouverAcceptesParOrganisation(organisationId: number): Observable<Beneficiaire[]> {
    return this.http.get<Beneficiaire[]>(`${this.apiUrl}/acceptes/organisation/${organisationId}`);
  }

  accepter(id: number): Observable<Beneficiaire> {
    return this.http.put<Beneficiaire>(`${this.apiUrl}/${id}/accepter`, {});
  }

  refuser(id: number, motif?: string): Observable<Beneficiaire> {
    return this.http.put<Beneficiaire>(
      `${this.apiUrl}/${id}/refuser`,
      {},
      {
        params: motif ? { motif } : {}
      }
    );
  }

  creer(dto: any): Observable<Beneficiaire> {
    return this.http.post<Beneficiaire>(this.apiUrl, dto);
  }

  // --- Endpoints Spécifiques Particuliers (/api/beneficiaires/particuliers) ---
  getParticuliers(): Observable<BeneficiaireParticulier[]> {
    return this.http.get<BeneficiaireParticulier[]>(`${this.apiUrl}/particuliers`);
  }

  getParticulierById(id: number): Observable<BeneficiaireParticulier> {
    return this.http.get<BeneficiaireParticulier>(`${this.apiUrl}/particuliers/${id}`);
  }

  creerParticulier(dto: BeneficiaireParticulierRequestDTO): Observable<BeneficiaireParticulier> {
    return this.http.post<BeneficiaireParticulier>(`${this.apiUrl}/particuliers`, dto);
  }

  modifierParticulier(id: number, dto: BeneficiaireParticulierRequestDTO): Observable<BeneficiaireParticulier> {
    return this.http.put<BeneficiaireParticulier>(`${this.apiUrl}/particuliers/${id}`, dto);
  }

  // --- Endpoints Spécifiques Structures (/api/beneficiaires/structures) ---
  getStructures(): Observable<BeneficiaireStructure[]> {
    return this.http.get<BeneficiaireStructure[]>(`${this.apiUrl}/structures`);
  }

  getStructureById(id: number): Observable<BeneficiaireStructure> {
    return this.http.get<BeneficiaireStructure>(`${this.apiUrl}/structures/${id}`);
  }

  creerStructure(dto: BeneficiaireStructureRequestDTO): Observable<BeneficiaireStructure> {
    return this.http.post<BeneficiaireStructure>(`${this.apiUrl}/structures`, dto);
  }

  modifierStructure(id: number, dto: BeneficiaireStructureRequestDTO): Observable<BeneficiaireStructure> {
    return this.http.put<BeneficiaireStructure>(`${this.apiUrl}/structures/${id}`, dto);
  }

  // --- Affectations dons matériels ---
  getByBeneficiaire(beneficiaireId: number): Observable<AffectationDonMaterielResponse[]> {
    return this.http.get<AffectationDonMaterielResponse[]>(`${this.apiUrl}/beneficiaire/${beneficiaireId}`);
  }
}