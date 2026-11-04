import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RapportTechnique, DetailRapportTechnique } from '../../models/etude.model';

@Component({
  selector: 'app-rapport-technique',
  imports: [CommonModule, FormsModule],
  templateUrl: './rapport-technique.html',
  styleUrl: './rapport-technique.css',
  standalone: true
})
export class RapportTechniqueComponent {
  rapport: RapportTechnique = {
    descriptionTechnique: '',
    dateCreation: new Date(),
    details: []
  };

  creerRapport(): void {
    console.log('Rapport technique créé', this.rapport);
  }

  modifierRapport(): void {
    console.log('Rapport technique modifié', this.rapport);
  }

  validerRapport(): void {
    console.log('Rapport technique validé', this.rapport);
  }

  calculerCoutTotal(): number {
    if (!this.rapport.details) return 0;
    return this.rapport.details.reduce((total, detail) => total + detail.montant, 0);
  }

  effectuerDetail(index: number): void {
    console.log('Détail effectué', index);
  }
  
  confirmerDetail(index: number): void {
    console.log('Détail confirmé', index);
  }
  
  annulerDetail(index: number): void {
    console.log('Détail annulé', index);
  }
}
