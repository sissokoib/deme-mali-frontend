import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common'; // Import pour *ngFor et *ngIf
import { EtudeTerrainService } from '../../../services/etude-terrain.service';
import { EtudeTerrain } from '../../../models/etude.model';

@Component({
  selector: 'app-etudes-liste',
  imports: [RouterLink, CommonModule],
  templateUrl: './etudes-liste.html',
  styleUrl: './etudes-liste.css',
})
export class EtudesListe implements OnInit {
  
  etudes: EtudeTerrain[] = [];
  
  // Statistiques
  aPlanifier = 0;
  planifiee = 0;
  terminee = 0;

  constructor(private etudeService: EtudeTerrainService) {}

  ngOnInit(): void {
    // 1. On appelle le backend (le service) pour récupérer les données dynamiques
    this.etudeService.getEtudes().subscribe(data => {
      this.etudes = data;
      this.calculerStatistiques();
    });
  }

  // 2. On calcule automatiquement les statistiques en fonction de la base de données !
  calculerStatistiques() {
    this.aPlanifier = this.etudes.filter(e => e.status === 'En attente').length;
    this.planifiee = this.etudes.filter(e => e.status === 'Planifiée').length;
    this.terminee = this.etudes.filter(e => e.status === 'Terminée').length;
  }
}
