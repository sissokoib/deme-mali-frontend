import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RapportBesoin } from '../../models/etude.model';

@Component({
  selector: 'app-rapport-besoin',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './rapport-besoin.html',
  styleUrl: './rapport-besoin.css',
  standalone: true
})
export class RapportBesoinComponent {
  rapport: RapportBesoin = {
    titre: '',
    besoinIdentifie: '',
    descriptionSituation: '',
    solutionProposee: '',
    montantEstime: 0,
    dateCreation: new Date()
  };

  creerRapport(): void {
    console.log('Rapport créé', this.rapport);
  }

  modifierRapport(): void {
    console.log('Rapport modifié', this.rapport);
  }

  validerRapport(): void {
    console.log('Rapport validé', this.rapport);
  }

  consulterRapport(): RapportBesoin {
    console.log('Consultation rapport');
    return this.rapport;
  }
}
