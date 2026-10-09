import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-projets-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './projets-admin.html',
  styleUrl: './projets-admin.css',
})
export class ProjetsAdmin implements OnInit {
  projets = [
    { id: 'PRJ001', nom: 'Achat d\'équipement solaire pour une mosquée', region: 'Koulikoro', responsable: 'Dialla Coulibaly', type: 'Culture', statut: 'En cours', statutClass: 'status-encours', progression: 50 },
    { id: 'PRJ002', nom: 'Achat d\'équipement solaire pour une mosquée', region: 'Koulikoro', responsable: 'Dialla Coulibaly', type: 'Culture', statut: 'En cours', statutClass: 'status-encours', progression: 50 },
    { id: 'PRJ003', nom: 'Achat d\'équipement solaire pour une mosquée', region: 'Koulikoro', responsable: 'Dialla Coulibaly', type: 'Culture', statut: 'En cours', statutClass: 'status-encours', progression: 50 },
    { id: 'PRJ004', nom: 'Achat d\'équipement solaire pour une mosquée', region: 'Koulikoro', responsable: 'Dialla Coulibaly', type: 'Culture', statut: 'En cours', statutClass: 'status-encours', progression: 50 },
    { id: 'PRJ005', nom: 'Achat d\'équipement solaire pour une mosquée', region: 'Koulikoro', responsable: 'Dialla Coulibaly', type: 'Culture', statut: 'En cours', statutClass: 'status-encours', progression: 50 }
  ];

  etapes = [
    { date: '15/09/2026', titre: 'Validation Financière pour les achats', statut: 'Confirmé' },
    { date: '15/09/2026', titre: 'Validation Financière pour les achats', statut: 'Confirmé' },
    { date: '15/09/2026', titre: 'Validation Financière pour les achats', statut: 'Confirmé' },
    { date: '15/09/2026', titre: 'Validation Financière pour les achats', statut: 'Confirmé' },
    { date: '15/09/2026', titre: 'Validation Financière pour les achats', statut: 'Confirmé' },
    { date: '15/09/2026', titre: 'Validation Financière pour les achats', statut: 'Confirmé' }
  ];

  constructor() {}
  ngOnInit() {}
}
