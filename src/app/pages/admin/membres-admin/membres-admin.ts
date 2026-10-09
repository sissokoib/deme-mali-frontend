import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-membres-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './membres-admin.html',
  styleUrl: './membres-admin.css',
})
export class MembresAdmin implements OnInit {
  activeTab = 'Tous';
  
  membres = [
    { id: 'MEM001', nom: 'Amadou Traoré', type: 'Personnel', inscription: 'Création Admin', statut: 'Approuvé', statutClass: 'status-approuve' },
    { id: 'MEM002', nom: 'Mariam Keïta', type: 'Personnel', inscription: 'Création Admin', statut: 'Approuvé', statutClass: 'status-approuve' },
    { id: 'MEM003', nom: 'Mariam Keïta', type: 'Personnel', inscription: 'Création Admin', statut: 'Approuvé', statutClass: 'status-approuve' },
    { id: 'MEM004', nom: 'Mariam Keïta', type: 'Bénéficiaire', inscription: 'Création Admin', statut: 'En attente', statutClass: 'status-attente' },
    { id: 'MEM005', nom: 'Mariam Keïta', type: 'Bénéficiaire', inscription: 'Création Admin', statut: 'Refuser', statutClass: 'status-refuse' }
  ];

  setTab(tab: string) {
    this.activeTab = tab;
  }

  constructor() {}
  ngOnInit() {}
}
