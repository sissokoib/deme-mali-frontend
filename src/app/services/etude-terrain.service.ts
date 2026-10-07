import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { EtudeTerrain, ResultatEtude } from '../models/etude.model';
import { Demande } from '../models/demande.model';

@Injectable({
  providedIn: 'root'
})
export class EtudeTerrainService {

  private apiUrl = '/api/etudes';

  constructor(private http: HttpClient) { }

  // 1. Récupérer toutes les études
  getEtudes(): Observable<EtudeTerrain[]> {
    // Si tu as ton backend prêt, tu utiliseras :
    // return this.http.get<EtudeTerrain[]>(this.apiUrl);
    
    // Pour l'instant on utilise des fausses données (Mock) pour tester le visuel dynamique
    return of([
      {
        id: 1,
        demande: { id: 1, titre: 'Aide alimentaire pour une famille', beneficiaire: 'Famille Traoré', categorie: 'Alimentaire', urgence: 'Élevée', date: '25 sept. 2026', statut: 'EN_ATTENTE', montantNecessaire: 250000 },
        datePlanification: new Date(),
        dateRealisation: new Date(),
        lieu: 'Kalaban-Coura',
        objectif: 'Vérifier la situation...',
        observation: '',
        resultat: ResultatEtude.EN_ATTENTE,
        heure: '10:00',
        status: 'En attente'
      },
      {
        id: 2,
        demande: { id: 2, titre: 'Fournitures scolaires', beneficiaire: 'Famille Diallo', categorie: 'Éducation', urgence: 'Moyenne', date: '26 sept. 2026', statut: 'PLANIFIEE', montantNecessaire: 50000 },
        datePlanification: new Date('2026-09-27'),
        dateRealisation: new Date(),
        lieu: 'Lafiabougou',
        objectif: 'Vérifier scolarité',
        observation: '',
        resultat: ResultatEtude.PLANIFIER,
        heure: '14:30',
        status: 'Planifiée'
      }
    ]);
  }

  // 2. Planifier une nouvelle étude
  planifierEtude(demandeId: number, etude: EtudeTerrain): Observable<EtudeTerrain> {
    return this.http.post<EtudeTerrain>(`${this.apiUrl}/planifier/${demandeId}`, etude);
  }
}
