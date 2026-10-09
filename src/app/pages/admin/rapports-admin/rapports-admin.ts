import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rapports-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rapports-admin.html',
  styleUrl: './rapports-admin.css',
})
export class RapportsAdmin implements OnInit {
  rapports = [
    { nom: 'Argent reçu et dépensé', type: 'Argent', typeClass: 'badge-argent', projet: 'Écoles de Bamako', periode: 'T3 2026', statut: 'Publié', statutClass: 'status-publie' },
    { nom: 'Dons reçus', type: 'Dons', typeClass: 'badge-dons', projet: 'Centre de santé Koulikoro', periode: 'T3 2026', statut: 'Publié', statutClass: 'status-publie' },
    { nom: 'Aides distribuées', type: 'Aides', typeClass: 'badge-aides', projet: 'Projet Eau potable', periode: 'T3 2026', statut: 'Publié', statutClass: 'status-publie' },
    { nom: 'Personnes aidées', type: 'Personnes', typeClass: 'badge-personnes', projet: 'Centre d\'accueil', periode: 'T3 2026', statut: 'Brouillon', statutClass: 'status-brouillon' },
    { nom: 'Vérification et justificatifs', type: 'Vérification', typeClass: 'badge-verif', projet: 'Projet Santé', periode: 'Sept. 2026', statut: 'Publié', statutClass: 'status-publie' }
  ];

  constructor() {}
  ngOnInit() {}
}
