import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-partenaires-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './partenaires-admin.html',
  styleUrl: './partenaires-admin.css',
})
export class PartenairesAdmin implements OnInit {
  partenaires = [
    { id: 'PAR001', nom: 'Fondation Orange Mali', secteur: 'Social', date: '2026-2026', contact: 'Aliou Cissé', phone: '+223 70 00 00 00', projets: 'Projets Co-financés 2', statut: 'Validé', statutClass: 'status-valide' },
    { id: 'PAR002', nom: 'Fondation Orange Mali', secteur: 'Social', date: '2026-2026', contact: 'Aliou Cissé', phone: '+223 70 00 00 00', projets: 'Projets Co-financés 2', statut: 'Validé', statutClass: 'status-valide' },
    { id: 'PAR001', nom: 'Fondation Orange Mali', secteur: 'Social', date: '2026-2026', contact: 'Aliou Cissé', phone: '+223 70 00 00 00', projets: 'Projets Co-financés 2', statut: 'Validé', statutClass: 'status-valide' },
    { id: 'PAR001', nom: 'Fondation Orange Mali', secteur: 'Social', date: '2026-2026', contact: 'Aliou Cissé', phone: '+223 70 00 00 00', projets: 'Projets Co-financés 2', statut: 'Validé', statutClass: 'status-valide' },
    { id: 'PAR001', nom: 'Fondation Orange Mali', secteur: 'Social', date: '2026-2026', contact: 'Aliou Cissé', phone: '+223 70 00 00 00', projets: 'Projets Co-financés 2', statut: 'Validé', statutClass: 'status-valide' }
  ];

  constructor() {}
  ngOnInit() {}
}
