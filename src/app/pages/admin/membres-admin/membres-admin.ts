import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { BeneficiaireService } from '../../../services/beneficiaire';

export interface MembreItem {
  id: string;
  rawId?: number;
  nom: string;
  type: string;
  role: string;
  region: string;
  date: string;
  inscription: string;
  statut: string;
  statutClass: string;
  email?: string;
  phone?: string;
}

@Component({
  selector: 'app-membres-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './membres-admin.html',
  styleUrl: './membres-admin.css',
})
export class MembresAdmin implements OnInit {
  activeTab = 'Tous';
  searchTerm = '';
  isModalOpen = false;
  membreSelectionne: MembreItem | null = null;
  isLoading = false;

  nouveauMembre = {
    nom: '',
    type: 'Personnel',
    role: '',
    region: 'Bamako',
    inscription: 'Création Admin',
    statut: 'Approuvé',
    email: '',
    phone: ''
  };

  membres: MembreItem[] = [];

  constructor(
    private beneficiaireService: BeneficiaireService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.chargerBeneficiaires();
  }

  chargerBeneficiaires() {
    this.isLoading = true;
    this.beneficiaireService.getAllBeneficiaires().subscribe({
      next: (beneficiaires: any[]) => {
        const apiBeneficiaires: MembreItem[] = (beneficiaires || []).map((b: any) => {
          const isApprouve = b.statut === 'ACCEPTE' || b.statut === 'Approuvé';
          const isRefuse = b.statut === 'REFUSE' || b.statut === 'Refusé';
          const statut = isApprouve ? 'Approuvé' : (isRefuse ? 'Refusé' : 'En attente');
          const statutClass = isApprouve ? 'status-approuve' : (isRefuse ? 'status-refuse' : 'status-attente');
          const role = b.typeBeneficiaire === 'STRUCTURE' ? 'Structure associative' : 'Particulier demandeur';

          return {
            id: 'BEN' + String(b.id).padStart(3, '0'),
            rawId: b.id,
            nom: `${b.prenom || ''} ${b.nom || ''}`.trim() || 'Bénéficiaire',
            type: 'Bénéficiaire',
            role: role,
            region: b.ville || 'Bamako',
            date: b.dateValidation ? new Date(b.dateValidation).toLocaleDateString('fr-FR') : (b.dateCreation ? new Date(b.dateCreation).toLocaleDateString('fr-FR') : '12/10/2026'),
            inscription: 'Enregistrement Bénéficiaire',
            statut: statut,
            statutClass: statutClass,
            phone: b.telephone || '+223 70 00 00 00',
            email: b.email || ''
          };
        });

        // Charge également les donateurs enregistrés
        this.http.get<any[]>('http://localhost:8080/api/donateurs').subscribe({
          next: (donateurs: any[]) => {
            this.isLoading = false;
            const apiDonateurs: MembreItem[] = (donateurs || []).map((d: any) => ({
              id: 'DON' + String(d.id).padStart(3, '0'),
              rawId: d.id,
              nom: `${d.prenom || ''} ${d.nom || ''}`.trim() || 'Donateur',
              type: 'Personnel',
              role: 'Donateur Bienfaiteur',
              region: 'Bamako',
              date: '12/10/2026',
              inscription: 'Compte Donateur',
              statut: 'Approuvé',
              statutClass: 'status-approuve',
              phone: d.telephone || '+223 70 00 00 00',
              email: ''
            }));

            this.membres = [...apiBeneficiaires, ...apiDonateurs];
          },
          error: () => {
            this.isLoading = false;
            this.membres = apiBeneficiaires;
          }
        });
      },
      error: (err: any) => {
        this.isLoading = false;
        this.membres = [];
        console.warn('Erreur chargement des membres depuis le backend', err);
      }
    });
  }

  get membresFiltres(): MembreItem[] {
    return this.membres.filter(m => {
      const matchTab =
        this.activeTab === 'Tous' ? true :
        this.activeTab === 'Personnel' ? m.type === 'Personnel' :
        this.activeTab === 'Bénéficiaires' ? m.type === 'Bénéficiaire' :
        this.activeTab === 'Demandes en attente' ? m.statut === 'En attente' :
        this.activeTab === 'Rejetés' ? m.statut === 'Refusé' : true;

      const q = this.searchTerm.trim().toLowerCase();
      const matchSearch = !q ? true :
        m.nom.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        m.region.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q);

      return matchTab && matchSearch;
    });
  }

  getCount(tab: string): number {
    if (tab === 'Tous') return this.membres.length;
    if (tab === 'Personnel') return this.membres.filter(m => m.type === 'Personnel').length;
    if (tab === 'Bénéficiaires') return this.membres.filter(m => m.type === 'Bénéficiaire').length;
    if (tab === 'Demandes en attente') return this.membres.filter(m => m.statut === 'En attente').length;
    if (tab === 'Rejetés') return this.membres.filter(m => m.statut === 'Refusé').length;
    return 0;
  }

  setTab(tab: string) {
    this.activeTab = tab;
  }

  changerStatut(m: MembreItem, nouveauStatut: 'Approuvé' | 'Refusé' | 'En attente') {
    m.statut = nouveauStatut;
    m.statutClass =
      nouveauStatut === 'Approuvé' ? 'status-approuve' :
      nouveauStatut === 'En attente' ? 'status-attente' : 'status-refuse';

    if (m.rawId && m.type === 'Bénéficiaire') {
      if (nouveauStatut === 'Approuvé') {
        this.beneficiaireService.accepter(m.rawId).subscribe({
          next: () => {},
          error: (err) => console.warn('Statut changé localement', err)
        });
      } else if (nouveauStatut === 'Refusé') {
        this.beneficiaireService.refuser(m.rawId, 'Motif administratif').subscribe({
          next: () => {},
          error: (err) => console.warn('Statut changé localement', err)
        });
      }
    }
  }

  ouvrirDetails(m: MembreItem) {
    this.membreSelectionne = m;
  }

  fermerDetails() {
    this.membreSelectionne = null;
  }

  ouvrirModal() {
    this.nouveauMembre = {
      nom: '',
      type: 'Personnel',
      role: '',
      region: 'Bamako',
      inscription: 'Création Admin',
      statut: 'Approuvé',
      email: '',
      phone: ''
    };
    this.isModalOpen = true;
  }

  fermerModal() {
    this.isModalOpen = false;
  }

  enregistrerMembre() {
    if (!this.nouveauMembre.nom.trim()) {
      return;
    }

    const nextNumber = this.membres.length + 1;
    const formattedId = 'MEM' + String(nextNumber).padStart(3, '0');
    const today = new Date().toLocaleDateString('fr-FR');

    const statutClass =
      this.nouveauMembre.statut === 'Approuvé' ? 'status-approuve' :
      this.nouveauMembre.statut === 'En attente' ? 'status-attente' : 'status-refuse';

    const item: MembreItem = {
      id: formattedId,
      nom: this.nouveauMembre.nom.trim(),
      type: this.nouveauMembre.type,
      role: this.nouveauMembre.role.trim() || (this.nouveauMembre.type === 'Personnel' ? 'Personnel Dèmè' : 'Bénéficiaire'),
      region: this.nouveauMembre.region,
      date: today,
      inscription: this.nouveauMembre.inscription,
      statut: this.nouveauMembre.statut,
      statutClass: statutClass,
      phone: this.nouveauMembre.phone.trim() || '+223 70 00 00 00',
      email: this.nouveauMembre.email.trim()
    };

    this.membres.unshift(item);
    this.isModalOpen = false;
  }
}

