import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EtudeTerrain, ResultatEtude } from '../../models/etude.model';

@Component({
  selector: 'app-etude-terrain',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './etude-terrain.html',
  styleUrl: './etude-terrain.css',
  standalone: true
})
export class EtudeTerrainComponent {
  etude: EtudeTerrain = {
    dateRealisation: new Date(),
    datePlanification: new Date(),
    lieu: '',
    objectif: '',
    observation: '',
    resultat: ResultatEtude.EN_ATTENTE,
    heure: '',
    status: ''
  };

  enregistre(): void {
    console.log('Etude enregistrée', this.etude);
  }

  modifier(): void {
    console.log('Etude modifiée', this.etude);
  }
}
