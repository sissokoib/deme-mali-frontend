import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { retry } from 'rxjs/operators';
import { OrganisationService } from '../../../services/organisation';
import {
  OrganisationPartenaireRequestDTO,
  OrganisationPartenaireResponseDTO,
  TypeOrganisation
} from '../../../models/organisation.model';

export interface PartenaireItem {
  id: string;
  rawId?: number;
  nom: string;
  secteur: string;
  typeOrganisation: TypeOrganisation;
  date: string;
  contact: string;
  phone: string;
  email?: string;
  projets: string;
  statut: string;
  statutClass: string;
  nif?: string;
  adresse?: string;
  ville?: string;
  documentJustificatif?: string;
  rawStatutValidation?: string;
  description?: string;
}

import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-partenaires-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
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
    nomOrganisation: '',
    typeOrganisation: 'ONG' as TypeOrganisation,
    nif: '',
    adresse: '',
    ville: 'Bamako',
    telephoneOrganisation: '',
    email: '',
    prenom: '',
    nom: '',
    telephone: '',
    description: '',
    motDePasse: '123456'
  };

  selectedFile: File | null = null;
  partenaires: PartenaireItem[] = [];

  constructor(
    private organisationService: OrganisationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.chargerOrganisations();
  }

  chargerOrganisations(tentative = 1) {
    this.isLoading = true;
    this.organisationService.getAllOrganisations().pipe(
      retry({ count: 2, delay: 1000 })
    ).subscribe({
      next: (data: OrganisationPartenaireResponseDTO[]) => {
        this.isLoading = false;
        if (data && data.length > 0) {
          this.partenaires = data.map((org: OrganisationPartenaireResponseDTO) => {
            const rawStatus = (org.statutValidation || org.statut || '').toUpperCase();
            const isValide = rawStatus === 'VALIDEE' || rawStatus === 'VALIDE';
            const isRejete = rawStatus === 'REJETEE' || rawStatus === 'REFUSEE';
            const statut = isValide ? 'Validé' : (isRejete ? 'Rejeté' : 'En attente');
            const statutClass = isValide ? 'status-valide' : (isRejete ? 'status-refuse' : 'status-attente');

            const dateAffiliation = org.dateInscription ? new Date(org.dateInscription).toLocaleDateString('fr-FR') : 'Non renseignée';
            const contactName = (org.prenom || org.nom) ? `${org.prenom || ''} ${org.nom || ''}`.trim() : (org.nomOrganisation || 'Point focal');

            return {
              id: 'PAR' + String(org.id).padStart(3, '0'),
              rawId: org.id,
              nom: org.nomOrganisation || 'Organisation Partenaire',
              secteur: org.typeOrganisation || 'ONG',
              typeOrganisation: org.typeOrganisation || 'ONG',
              date: dateAffiliation,
              contact: contactName,
              phone: org.telephoneOrganisation || org.telephone || '+223 70 00 00 00',
              email: org.email || '',
              projets: 'Convention active',
              statut: statut,
              statutClass: statutClass,
              nif: org.nif,
              adresse: org.adresse,
              ville: org.ville || 'Bamako',
              documentJustificatif: org.documentJustificatif,
              rawStatutValidation: org.statutValidation,
              description: org.description
            };
          });
        } else {
          this.partenaires = [];
          if (tentative <= 2) {
            setTimeout(() => this.chargerOrganisations(tentative + 1), 2000);
          }
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.isLoading = false;
        console.warn('Erreur chargement des partenaires depuis le backend', err);
        if (tentative <= 3) {
          setTimeout(() => this.chargerOrganisations(tentative + 1), 2000);
        }
        this.cdr.detectChanges();
      }
    });
  }

  get partenairesFiltres(): PartenaireItem[] {
    return this.partenaires.filter(p => {
      const f = this.filterStatus;
      let matchStatus = true;
      if (f === 'Validé' || f.toLowerCase().includes('valid')) {
        matchStatus = p.statut === 'Validé' || (p.rawStatutValidation ? p.rawStatutValidation.toUpperCase().includes('VALID') : false);
      } else if (f === 'En attente' || f.toLowerCase().includes('attente')) {
        matchStatus = p.statut === 'En attente';
      } else if (f === 'Rejeté' || f.toLowerCase().includes('rejet') || f.toLowerCase().includes('refus')) {
        matchStatus = p.statut === 'Rejeté' || (p.rawStatutValidation ? p.rawStatutValidation.toUpperCase().includes('REJET') : false);
      }

      const q = this.searchTerm.trim().toLowerCase();
      const matchSearch = !q ? true :
        (p.nom && p.nom.toLowerCase().includes(q)) ||
        (p.id && p.id.toLowerCase().includes(q)) ||
        (p.secteur && p.secteur.toLowerCase().includes(q)) ||
        (p.contact && p.contact.toLowerCase().includes(q)) ||
        (p.nif ? p.nif.toLowerCase().includes(q) : false) ||
        (p.phone && p.phone.includes(q));

      return matchStatus && matchSearch;
    });
  }

  // Pagination (10 par page)
  pageActuelle: number = 1;
  elementsParPage: number = 10;

  get totalPages(): number {
    return Math.ceil(this.partenairesFiltres.length / this.elementsParPage) || 1;
  }

  get pages(): number[] {
    const arr: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      arr.push(i);
    }
    return arr;
  }

  get partenairesPaginees(): PartenaireItem[] {
    const startIndex = (this.pageActuelle - 1) * this.elementsParPage;
    return this.partenairesFiltres.slice(startIndex, startIndex + this.elementsParPage);
  }

  allerPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.pageActuelle = page;
      this.cdr.detectChanges();
    }
  }

  pagePrecedente() {
    if (this.pageActuelle > 1) {
      this.pageActuelle--;
      this.cdr.detectChanges();
    }
  }

  pageSuivante() {
    if (this.pageActuelle < this.totalPages) {
      this.pageActuelle++;
      this.cdr.detectChanges();
    }
  }

  setFilterStatus(status: string) {
    this.pageActuelle = 1;
    this.filterStatus = status;
  }

  onSearchChange() {
    this.pageActuelle = 1;
  }

  getCount(status: string): number {
    if (status === 'Tous') return this.partenaires.length;
    if (status === 'Validé' || status.toLowerCase().includes('valid')) {
      return this.partenaires.filter(p => p.statut === 'Validé').length;
    }
    if (status === 'En attente' || status.toLowerCase().includes('attente')) {
      return this.partenaires.filter(p => p.statut === 'En attente').length;
    }
    if (status === 'Rejeté' || status.toLowerCase().includes('rejet')) {
      return this.partenaires.filter(p => p.statut === 'Rejeté').length;
    }
    return 0;
  }

  getUniqueSecteursCount(): number {
    return new Set(this.partenaires.map(p => p.secteur)).size;
  }

  getTotalValides(): number {
    return this.partenaires.filter(p => p.statut === 'Validé').length;
  }

  ouvrirModal() {
    this.nouveauPartenaire = {
      nomOrganisation: '',
      typeOrganisation: 'ONG' as TypeOrganisation,
      nif: '',
      adresse: '',
      ville: 'Bamako',
      telephoneOrganisation: '',
      email: '',
      prenom: '',
      nom: '',
      telephone: '',
      description: '',
      motDePasse: '123456'
    };
    this.selectedFile = null;
    this.isModalOpen = true;
  }

  fermerModal() {
    this.isModalOpen = false;
  }

  onFileChange(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  ouvrirDetails(p: PartenaireItem) {
    this.partenaireSelectionne = p;
  }

  fermerDetails() {
    this.partenaireSelectionne = null;
  }

  changerStatut(p: PartenaireItem, nouveauStatutValidation: 'VALIDEE' | 'EN_ATTENTE' | 'REJETEE') {
    const labelStatut = nouveauStatutValidation === 'VALIDEE' ? 'Validé' :
                        (nouveauStatutValidation === 'REJETEE' ? 'Rejeté' : 'En attente');
    const statutClass = nouveauStatutValidation === 'VALIDEE' ? 'status-valide' :
                        (nouveauStatutValidation === 'REJETEE' ? 'status-refuse' : 'status-attente');

    p.statut = labelStatut;
    p.statutClass = statutClass;
    p.rawStatutValidation = nouveauStatutValidation;

    if (this.partenaireSelectionne && this.partenaireSelectionne.id === p.id) {
      this.partenaireSelectionne.statut = labelStatut;
      this.partenaireSelectionne.statutClass = statutClass;
      this.partenaireSelectionne.rawStatutValidation = nouveauStatutValidation;
    }

    if (p.rawId) {
      this.organisationService.changerStatut(p.rawId, nouveauStatutValidation).subscribe({
        next: () => {},
        error: (err: any) => console.warn('Erreur changement de statut partenaire', err)
      });
    }
  }

  enregistrerPartenaire() {
    if (!this.nouveauPartenaire.nomOrganisation.trim() || !this.nouveauPartenaire.telephoneOrganisation.trim()) {
      return;
    }

    const payload: OrganisationPartenaireRequestDTO = {
      nomOrganisation: this.nouveauPartenaire.nomOrganisation.trim(),
      typeOrganisation: this.nouveauPartenaire.typeOrganisation,
      nif: this.nouveauPartenaire.nif.trim(),
      adresse: this.nouveauPartenaire.adresse.trim(),
      ville: this.nouveauPartenaire.ville,
      telephoneOrganisation: this.nouveauPartenaire.telephoneOrganisation.trim(),
      email: this.nouveauPartenaire.email.trim(),
      prenom: this.nouveauPartenaire.prenom.trim() || 'Représentant',
      nom: this.nouveauPartenaire.nom.trim() || this.nouveauPartenaire.nomOrganisation.trim(),
      telephone: this.nouveauPartenaire.telephone.trim() || this.nouveauPartenaire.telephoneOrganisation.trim(),
      description: this.nouveauPartenaire.description.trim() || undefined,
      motDePasse: this.nouveauPartenaire.motDePasse || '123456'
    };

    this.organisationService.creerOrganisation(payload, this.selectedFile || undefined).subscribe({
      next: () => {
        this.chargerOrganisations();
        this.fermerModal();
      },
      error: (err: any) => {
        console.error('Erreur enregistrement partenaire', err);
        this.fermerModal();
      }
    });
  }
}
