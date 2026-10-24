import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BeneficiaireService } from '../../../services/beneficiaire';
import { DonateurService } from '../../../services/donateur.service';
import { UtilisateurService } from '../../../services/utilisateur.service';
import {
  Beneficiaire,
  BeneficiaireParticulier,
  BeneficiaireStructure
} from '../../../models/beneficiaire.model';
import { DonateurResponseDTO } from '../../../models/donateur.model';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface MembreItem {
  id: string;
  rawId?: number;
  rawUtilisateurId?: number;
  nom: string;
  type: string; // 'Bénéficiaire' | 'Personnel' | 'Donateur'
  typeBeneficiaire?: 'PARTICULIER' | 'STRUCTURE';
  role: string;
  region: string;
  date: string;
  inscription: string;
  statut: string;
  statutClass: string;
  email?: string;
  phone?: string;
  adresse?: string;
  ville?: string;
  motifRefus?: string;

  // Spécifique Particulier
  prenom?: string;
  situationMatrimonial?: string;
  typeHandicap?: string;
  nombreEnfants?: number;
  dateNaissance?: string;
  sexe?: string;
  typeBeneficiaireParticulier?: string;
  descriptionSituation?: string;

  // Spécifique Structure
  nomStructure?: string;
  nina?: string;
  nif?: string;
  documentJustificatif?: string;
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

  // Modal de refus avec motif
  isRefusModalOpen = false;
  membreARefuser: MembreItem | null = null;
  motifRefusTexte = '';

  // Formulaire d'ajout
  typeMembreAjout: 'Personnel' | 'Particulier' | 'Structure' = 'Particulier';
  nouveauParticulier = {
    nom: '',
    prenom: '',
    telephone: '',
    ville: 'Bamako',
    adresse: '',
    sexe: 'HOMME',
    situationMatrimonial: 'CELIBATAIRE',
    typeBeneficiaireParticulier: 'DEMUNI',
    typeHandicap: '',
    nombreEnfants: 0,
    descriptionSituation: ''
  };

  nouveauStructure = {
    nomStructure: '',
    telephone: '',
    email: '',
    ville: 'Bamako',
    adresse: '',
    nina: '',
    nif: ''
  };

  nouveauPersonnel = {
    nom: '',
    prenom: '',
    role: 'ADMIN',
    region: 'Bamako',
    email: '',
    phone: '',
    motDePasse: '123456'
  };

  membres: MembreItem[] = [];

  constructor(
    private beneficiaireService: BeneficiaireService,
    private donateurService: DonateurService,
    private utilisateurService: UtilisateurService
  ) {}

  ngOnInit() {
    this.chargerTousLesMembres();
  }

  chargerTousLesMembres() {
    this.isLoading = true;

    forkJoin({
      beneficiaires: this.beneficiaireService.trouverTous().pipe(catchError(() => of([] as Beneficiaire[]))),
      particuliers: this.beneficiaireService.getParticuliers().pipe(catchError(() => of([] as BeneficiaireParticulier[]))),
      structures: this.beneficiaireService.getStructures().pipe(catchError(() => of([] as BeneficiaireStructure[]))),
      donateurs: this.donateurService.getAll().pipe(catchError(() => of([] as DonateurResponseDTO[])))
    }).subscribe({
      next: ({ beneficiaires, particuliers, structures, donateurs }) => {
        this.isLoading = false;

        const partMap = new Map<number, BeneficiaireParticulier>();
        (particuliers || []).forEach(p => partMap.set(p.id, p));

        const structMap = new Map<number, BeneficiaireStructure>();
        (structures || []).forEach(s => structMap.set(s.id, s));

        // 1. Bénéficiaires enrichis
        const apiBeneficiaires: MembreItem[] = (beneficiaires || []).map((b: Beneficiaire) => {
          const rawStatut = (b.statut as string) || '';
          const isApprouve = rawStatut === 'ACCEPTE' || rawStatut === 'VALIDEE';
          const isRefuse = rawStatut === 'REFUSE' || rawStatut === 'REFUSEE';
          const statut = isApprouve ? 'Approuvé' : (isRefuse ? 'Refusé' : 'En attente');
          const statutClass = isApprouve ? 'status-approuve' : (isRefuse ? 'status-refuse' : 'status-attente');

          let displayName = '';
          let displayRole = '';
          let modeInscription = '';
          const part = partMap.get(b.id);
          const struct = structMap.get(b.id);

          const phone = (part && part.telephone) || (struct && struct.telephone) || b.telephone || '+223 70 00 00 00';
          const email = (struct && struct.email) || b.email || '';

          if (b.typeBeneficiaire === 'STRUCTURE') {
            displayName = (struct && struct.nomStructure) || b.nomStructure || b.nom || 'Structure sans nom';
            displayRole = 'Structure associative' + ((struct && struct.nif) || b.nif ? ` • NIF: ${(struct && struct.nif) || b.nif}` : '');
            modeInscription = 'Compte Structure';
          } else {
            const prenomAffiche = (part && part.prenom) || b.prenom || '';
            const nomAffiche = (part && part.nom) || b.nom || '';
            displayName = `${prenomAffiche} ${nomAffiche}`.trim() || 'Particulier demandeur';
            const catPart = (part && part.typeBeneficiaireParticulier) || b.typeBeneficiaireParticulier || 'Particulier demandeur';
            const sitMat = (part && part.situationMatrimonial) || b.situationMatrimonial;
            displayRole = catPart + (sitMat ? ` • ${sitMat}` : '');
            modeInscription = 'Compte Particulier';
          }

          return {
            id: 'BEN' + String(b.id).padStart(3, '0'),
            rawId: b.id,
            nom: displayName,
            type: 'Bénéficiaire',
            typeBeneficiaire: b.typeBeneficiaire,
            role: displayRole,
            region: (part && part.ville) || (struct && struct.ville) || b.ville || 'Bamako',
            date: b.dateValidation ? new Date(b.dateValidation).toLocaleDateString('fr-FR') : 'Compte actif',
            inscription: modeInscription,
            statut: statut,
            statutClass: statutClass,
            phone: phone,
            email: email,
            ville: (part && part.ville) || (struct && struct.ville) || b.ville || 'Bamako',
            adresse: (part && part.adresse) || (struct && struct.adresse) || b.adresse || '',
            motifRefus: b.motifRefus || '',

            prenom: (part && part.prenom) || b.prenom,
            sexe: (part && part.sexe) || b.sexe,
            dateNaissance: (part && part.dateNaissance) || b.dateNaissance,
            situationMatrimonial: (part && part.situationMatrimonial) || b.situationMatrimonial,
            typeHandicap: (part && part.typeHandicap) || b.typeHandicap,
            nombreEnfants: (part && part.nombreEnfants !== undefined) ? part.nombreEnfants : b.nombreEnfants,
            typeBeneficiaireParticulier: (part && part.typeBeneficiaireParticulier) || b.typeBeneficiaireParticulier,
            descriptionSituation: (part && part.descriptionSituation) || b.descriptionSituation,

            nomStructure: (struct && struct.nomStructure) || b.nomStructure,
            nina: (struct && struct.nina) || b.nina,
            nif: (struct && struct.nif) || b.nif,
            documentJustificatif: (struct && struct.documentJustificatif) || b.documentJustificatif
          };
        });

        // 2. Donateurs
        const apiDonateurs: MembreItem[] = (donateurs || []).map((d: DonateurResponseDTO) => ({
          id: 'DON' + String(d.id).padStart(3, '0'),
          rawId: d.id,
          nom: `${d.prenom || ''} ${d.nom || ''}`.trim() || 'Donateur',
          type: 'Personnel',
          role: 'Donateur Bienfaiteur' + (d.nomPays ? ` (${d.nomPays})` : ''),
          region: d.nomPays || 'Bamako',
          date: 'Compte actif',
          inscription: 'Compte Donateur',
          statut: 'Approuvé',
          statutClass: 'status-approuve',
          phone: d.telephone || '+223 70 00 00 00',
          email: d.email || ''
        }));

        this.membres = [...apiBeneficiaires, ...apiDonateurs];
      },
      error: (err) => {
        this.isLoading = false;
        console.warn('Erreur chargement membres', err);
      }
    });
  }

  get membresFiltres(): MembreItem[] {
    return this.membres.filter(m => {
      const tab = this.activeTab;
      let matchTab = true;
      if (tab === 'Personnel') {
        matchTab = m.type === 'Personnel';
      } else if (tab === 'Bénéficiaires' || tab.toLowerCase().includes('benef') || tab.toLowerCase().includes('bénéf')) {
        matchTab = m.type === 'Bénéficiaire';
      } else if (tab === 'Demandes en attente' || tab.toLowerCase().includes('attente')) {
        matchTab = m.statut === 'En attente';
      } else if (tab === 'Rejetés' || tab.toLowerCase().includes('rejet') || tab.toLowerCase().includes('refus')) {
        matchTab = m.statut === 'Refusé';
      }

      const q = this.searchTerm.trim().toLowerCase();
      const matchSearch = !q ? true :
        (m.nom && m.nom.toLowerCase().includes(q)) ||
        (m.id && m.id.toLowerCase().includes(q)) ||
        (m.region && m.region.toLowerCase().includes(q)) ||
        (m.role && m.role.toLowerCase().includes(q)) ||
        (m.phone && m.phone.toLowerCase().includes(q));

      return matchTab && matchSearch;
    });
  }

  getCount(tab: string): number {
    if (tab === 'Tous') return this.membres.length;
    if (tab === 'Personnel') return this.membres.filter(m => m.type === 'Personnel').length;
    if (tab === 'Bénéficiaires' || tab.toLowerCase().includes('benef') || tab.toLowerCase().includes('bénéf')) {
      return this.membres.filter(m => m.type === 'Bénéficiaire').length;
    }
    if (tab === 'Demandes en attente' || tab.toLowerCase().includes('attente')) {
      return this.membres.filter(m => m.statut === 'En attente').length;
    }
    if (tab === 'Rejetés' || tab.toLowerCase().includes('rejet') || tab.toLowerCase().includes('refus')) {
      return this.membres.filter(m => m.statut === 'Refusé').length;
    }
    return 0;
  }

  setTab(tab: string) {
    this.activeTab = tab;
  }

  // --- Approbation ---
  approuver(m: MembreItem) {
    if (m.rawId && m.type === 'Bénéficiaire') {
      this.beneficiaireService.accepter(m.rawId).subscribe({
        next: () => {
          m.statut = 'Approuvé';
          m.statutClass = 'status-approuve';
          if (this.membreSelectionne && this.membreSelectionne.id === m.id) {
            this.membreSelectionne.statut = 'Approuvé';
            this.membreSelectionne.statutClass = 'status-approuve';
          }
        },
        error: (err) => console.error('Erreur acceptation bénéficiaire', err)
      });
    } else {
      m.statut = 'Approuvé';
      m.statutClass = 'status-approuve';
    }
  }

  // --- Refus avec Motif ---
  ouvrirRefusModal(m: MembreItem) {
    this.membreARefuser = m;
    this.motifRefusTexte = '';
    this.isRefusModalOpen = true;
  }

  fermerRefusModal() {
    this.isRefusModalOpen = false;
    this.membreARefuser = null;
    this.motifRefusTexte = '';
  }

  confirmerRefus() {
    if (!this.membreARefuser) return;
    const motif = this.motifRefusTexte.trim() || 'Dossier non conforme';
    const m = this.membreARefuser;

    if (m.rawId && m.type === 'Bénéficiaire') {
      this.beneficiaireService.refuser(m.rawId, motif).subscribe({
        next: () => {
          m.statut = 'Refusé';
          m.statutClass = 'status-refuse';
          m.motifRefus = motif;
          if (this.membreSelectionne && this.membreSelectionne.id === m.id) {
            this.membreSelectionne.statut = 'Refusé';
            this.membreSelectionne.statutClass = 'status-refuse';
            this.membreSelectionne.motifRefus = motif;
          }
          this.fermerRefusModal();
        },
        error: (err) => console.error('Erreur refus bénéficiaire', err)
      });
    } else {
      m.statut = 'Refusé';
      m.statutClass = 'status-refuse';
      m.motifRefus = motif;
      this.fermerRefusModal();
    }
  }

  // --- Consultation Fiche Détaillée ---
  ouvrirDetails(m: MembreItem) {
    this.membreSelectionne = m;

    if (m.rawId && m.typeBeneficiaire === 'PARTICULIER' && !m.descriptionSituation) {
      this.beneficiaireService.getParticulierById(m.rawId).subscribe({
        next: (p: BeneficiaireParticulier) => {
          if (this.membreSelectionne && this.membreSelectionne.rawId === p.id) {
            this.membreSelectionne.situationMatrimonial = p.situationMatrimonial;
            this.membreSelectionne.typeHandicap = p.typeHandicap;
            this.membreSelectionne.nombreEnfants = p.nombreEnfants;
            this.membreSelectionne.dateNaissance = p.dateNaissance;
            this.membreSelectionne.sexe = p.sexe;
            this.membreSelectionne.typeBeneficiaireParticulier = p.typeBeneficiaireParticulier;
            this.membreSelectionne.descriptionSituation = p.descriptionSituation;
          }
        },
        error: () => {}
      });
    }

    if (m.rawId && m.typeBeneficiaire === 'STRUCTURE' && (!m.nina || !m.nif)) {
      this.beneficiaireService.getStructureById(m.rawId).subscribe({
        next: (s: BeneficiaireStructure) => {
          if (this.membreSelectionne && this.membreSelectionne.rawId === s.id) {
            this.membreSelectionne.nomStructure = s.nomStructure;
            this.membreSelectionne.nina = s.nina;
            this.membreSelectionne.nif = s.nif;
            this.membreSelectionne.documentJustificatif = s.documentJustificatif;
          }
        },
        error: () => {}
      });
    }
  }

  fermerDetails() {
    this.membreSelectionne = null;
  }

  // --- Ajout d'un Nouveau Membre ---
  ouvrirModal() {
    this.isModalOpen = true;
  }

  fermerModal() {
    this.isModalOpen = false;
  }

  enregistrerMembre() {
    if (this.typeMembreAjout === 'Particulier') {
      if (!this.nouveauParticulier.nom.trim() || !this.nouveauParticulier.telephone.trim()) {
        return;
      }
      this.beneficiaireService.creerParticulier(this.nouveauParticulier).subscribe({
        next: () => {
          this.chargerTousLesMembres();
          this.fermerModal();
        },
        error: (err) => {
          console.error('Erreur création particulier', err);
          this.fermerModal();
        }
      });
    } else if (this.typeMembreAjout === 'Structure') {
      if (!this.nouveauStructure.nomStructure.trim() || !this.nouveauStructure.telephone.trim()) {
        return;
      }
      this.beneficiaireService.creerStructure(this.nouveauStructure).subscribe({
        next: () => {
          this.chargerTousLesMembres();
          this.fermerModal();
        },
        error: (err) => {
          console.error('Erreur création structure', err);
          this.fermerModal();
        }
      });
    } else {
      if (!this.nouveauPersonnel.nom.trim() || !this.nouveauPersonnel.phone.trim()) {
        return;
      }
      this.utilisateurService.ajouterUtilisateur({
        nom: this.nouveauPersonnel.nom,
        prenom: this.nouveauPersonnel.prenom,
        telephone: this.nouveauPersonnel.phone,
        motDePasse: this.nouveauPersonnel.motDePasse || '123456',
        role: this.nouveauPersonnel.role || 'ADMIN'
      }).subscribe({
        next: () => {
          this.chargerTousLesMembres();
          this.fermerModal();
        },
        error: (err) => {
          console.error('Erreur ajout utilisateur', err);
          this.fermerModal();
        }
      });
    }
  }
}
