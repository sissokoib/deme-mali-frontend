import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrganisationService } from '../../../services/organisation';

export interface PartenaireItem {
  id: string;
  rawId?: number;
  nom: string;
  secteur: string;
  date: string;
  contact: string;
  phone: string;
  email?: string;
  projets: string;
  statut: string;
  statutClass: string;
}

@Component({
  selector: 'app-partenaires-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './partenaires-admin.html',
  styleUrl: './partenaires-admin.css',
})
export class PartenairesAdmin implements OnInit {
  searchTerm = '';
  filterStatus = 'Tous';
  isModalOpen = false;
  partenaireSelectionne: PartenaireItem | null = null;
  isLoading = false;

  nouveauPartenaire = {
    nom: '',
    secteur: 'Social',
    contact: '',
    phone: '',
    email: '',
    projets: '1 projet',
    statut: 'Validé'
  };

  partenaires: PartenaireItem[] = [];

  constructor(private organisationService: OrganisationService) {}

  ngOnInit() {
    this.chargerOrganisations();
  }

  chargerOrganisations() {
    this.isLoading = true;
    this.organisationService.getAllOrganisations().subscribe({
      next: (data: any[]) => {
        this.isLoading = false;
        if (data && data.length > 0) {
          this.partenaires = data.map((org: any) => {
            const isValide = org.statutValidation === 'VALIDEE' || org.statutValidation === 'Validé';
            const isRejete = org.statutValidation === 'REJETEE' || org.statutValidation === 'Rejeté';
            const statut = isValide ? 'Validé' : (isRejete ? 'Rejeté' : 'En attente');
            const statutClass = isValide ? 'status-valide' : (isRejete ? 'status-refuse' : 'status-attente');
            const formattedDate = org.dateInscription ? new Date(org.dateInscription).toLocaleDateString('fr-FR') : '08/10/2026';
            const contactName = (org.prenom && org.nom) ? `${org.prenom} ${org.nom}` : (org.nomOrganisation || 'Point focal');

            return {
              id: 'PAR' + String(org.id).padStart(3, '0'),
              rawId: org.id,
              nom: org.nomOrganisation || 'Organisation Partenaire',
              secteur: org.typeOrganisation || 'Social',
              date: formattedDate,
              contact: contactName,
              phone: org.telephoneOrganisation || org.telephone || '+223 70 00 00 00',
              email: org.email || '',
              projets: '2 projets co-financés',
              statut: statut,
              statutClass: statutClass
            };
          });
        } else {
          this.partenaires = [];
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.partenaires = [];
        console.warn('Erreur chargement des partenaires depuis le backend', err);
      }
    });
  }

  get partenairesFiltres(): PartenaireItem[] {
    return this.partenaires.filter(p => {
      const matchStatus =
        this.filterStatus === 'Tous' ? true :
        this.filterStatus === 'Validé' ? p.statut === 'Validé' :
        this.filterStatus === 'En attente' ? p.statut === 'En attente' : true;

      const q = this.searchTerm.trim().toLowerCase();
      const matchSearch = !q ? true :
        p.nom.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.secteur.toLowerCase().includes(q) ||
        p.contact.toLowerCase().includes(q);

      return matchStatus && matchSearch;
    });
  }

  setFilterStatus(status: string) {
    this.filterStatus = status;
  }

  getUniqueSecteursCount(): number {
    return new Set(this.partenaires.map(p => p.secteur)).size;
  }

  getTotalProjetsCoFinances(): number {
    return this.partenaires.reduce((sum, p) => {
      const match = p.projets.match(/\d+/);
      return sum + (match ? parseInt(match[0], 10) : 1);
    }, 0);
  }

  ouvrirModal() {
    this.nouveauPartenaire = {
      nom: '',
      secteur: 'Social',
      contact: '',
      phone: '',
      email: '',
      projets: '1 projet',
      statut: 'Validé'
    };
    this.isModalOpen = true;
  }

  fermerModal() {
    this.isModalOpen = false;
  }

  ouvrirDetails(p: PartenaireItem) {
    this.partenaireSelectionne = p;
  }

  fermerDetails() {
    this.partenaireSelectionne = null;
  }

  changerStatut(p: PartenaireItem, nouveauStatut: 'Validé' | 'En attente') {
    p.statut = nouveauStatut;
    p.statutClass = nouveauStatut === 'Validé' ? 'status-valide' : 'status-attente';

    if (p.rawId) {
      const backendStatut = nouveauStatut === 'Validé' ? 'VALIDEE' : 'EN_ATTENTE';
      this.organisationService.changerStatut(p.rawId, backendStatut).subscribe({
        next: () => {},
        error: (err: any) => console.warn('Statut changé localement (API warning)', err)
      });
    }
  }

  enregistrerPartenaire() {
    if (!this.nouveauPartenaire.nom.trim()) {
      return;
    }

    const nextNumber = this.partenaires.length + 1;
    const nextId = 'PAR' + String(nextNumber).padStart(3, '0');
    const today = new Date().toLocaleDateString('fr-FR');
    const statutClass = this.nouveauPartenaire.statut === 'Validé' ? 'status-valide' : 'status-attente';

    const item: PartenaireItem = {
      id: nextId,
      nom: this.nouveauPartenaire.nom.trim(),
      secteur: this.nouveauPartenaire.secteur,
      date: today,
      contact: this.nouveauPartenaire.contact.trim() || 'Non renseigné',
      phone: this.nouveauPartenaire.phone.trim() || '+223 00 00 00 00',
      email: this.nouveauPartenaire.email.trim(),
      projets: this.nouveauPartenaire.projets,
      statut: this.nouveauPartenaire.statut,
      statutClass: statutClass
    };

    // Call backend API if possible
    const backendData = {
      nomOrganisation: item.nom,
      typeOrganisation: item.secteur,
      telephoneOrganisation: item.phone,
      email: item.email,
      statutValidation: this.nouveauPartenaire.statut === 'Validé' ? 'VALIDEE' : 'EN_ATTENTE'
    };

    this.organisationService.creerOrganisation(backendData).subscribe({
      next: (createdOrg: any) => {
        if (createdOrg && createdOrg.id) {
          item.rawId = createdOrg.id;
        }
      },
      error: (err: any) => console.warn('Enregistré localement (API warning)', err)
    });

    this.partenaires.unshift(item);
    this.isModalOpen = false;
  }
}

