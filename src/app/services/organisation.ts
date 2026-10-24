import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Organisation,
  OrganisationPartenaireRequestDTO,
  OrganisationPartenaireResponseDTO
} from '../models/organisation.model';

@Injectable({
  providedIn: 'root'
})
export class OrganisationService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/organisations-partenaires';

  getAllOrganisations(): Observable<OrganisationPartenaireResponseDTO[]> {
    return this.http.get<OrganisationPartenaireResponseDTO[]>(this.apiUrl);
  }

  getOrganisationById(id: number): Observable<OrganisationPartenaireResponseDTO> {
    return this.http.get<OrganisationPartenaireResponseDTO>(`${this.apiUrl}/${id}`);
  }

  creerOrganisation(data: OrganisationPartenaireRequestDTO, file?: File): Observable<OrganisationPartenaireResponseDTO> {
    const formData = new FormData();
    formData.append('organisation', new Blob([JSON.stringify(data)], {
      type: 'application/json'
    }));
    if (file) {
      formData.append('file', file);
    }
    return this.http.post<OrganisationPartenaireResponseDTO>(this.apiUrl, formData);
  }

  modifierOrganisation(id: number, data: any): Observable<OrganisationPartenaireResponseDTO> {
    return this.http.put<OrganisationPartenaireResponseDTO>(`${this.apiUrl}/${id}`, data);
  }

  changerStatut(id: number, statut: 'VALIDEE' | 'EN_ATTENTE' | 'REJETEE' | string): Observable<OrganisationPartenaireResponseDTO> {
    return this.http.patch<OrganisationPartenaireResponseDTO>(
      `${this.apiUrl}/${id}/statut`,
      null,
      {
        params: { statut }
      }
    );
  }

  enregistrerBeneficiaireParticulier(organisationId: number, dto: any): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${organisationId}/beneficiaires/particuliers`,
      dto
    );
  }
}
