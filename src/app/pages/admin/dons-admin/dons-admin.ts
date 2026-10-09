import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dons-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dons-admin.html',
  styleUrl: './dons-admin.css',
})
export class DonsAdmin implements OnInit {
  dons = [
    { id: 'DON001', donateur: 'Amadou Traoré', montant: '50 000 FCFA', categorie: 'Financier', mode: 'Orange Money', statut: 'Terminé', statutClass: 'status-termine' },
    { id: 'DON002', donateur: 'Mariam Keïta', montant: '10 Sacs de Riz', categorie: 'Alimentaire', mode: 'Livraison Directe', statut: 'Terminé', statutClass: 'status-termine' },
    { id: 'DON003', donateur: 'Mariam Keïta', montant: '20 Kits Scolaires', categorie: 'Fournitures', mode: 'Livraison Directe', statut: 'Terminé', statutClass: 'status-termine' },
    { id: 'DON004', donateur: 'Mariam Keïta', montant: '10 Cartons', categorie: 'Vêtements', mode: 'Dépôt Siège', statut: 'En attente', statutClass: 'status-attente' },
    { id: 'DON005', donateur: 'Mariam Keïta', montant: '5 Cartons', categorie: 'Vêtements', mode: 'Dépôt Siège', statut: 'En attente', statutClass: 'status-attente' },
    { id: 'DON005', donateur: 'Mariam Keïta', montant: '5 Cartons', categorie: 'Vêtements', mode: 'Dépôt Siège', statut: 'En attente', statutClass: 'status-attente' },
    { id: 'DON005', donateur: 'Mariam Keïta', montant: '5 Cartons', categorie: 'Vêtements', mode: 'Dépôt Siège', statut: 'En attente', statutClass: 'status-attente' }
  ];

  isFilterMenuOpen = false;

  toggleFilterMenu() {
    this.isFilterMenuOpen = !this.isFilterMenuOpen;
  }

  constructor() {}
  ngOnInit() {}
}
