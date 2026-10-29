import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { BeneficiaireService } from '../../../services/beneficiaire';
import { OrganisationService } from '../../../services/organisation';
import {
  Beneficiaire,
  BeneficiaireParticulier,
  BeneficiaireStructure
} from '../../../models/beneficiaire.model';
import { OrganisationPartenaireResponseDTO } from '../../../models/organisation.model';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface MembreItem {
  id: string;
  rawId?: number;
  categorieMembre: 'BENEFICIAIRE' | 'ORGANISATION';
  nom: string;
  prenom?: string;
  type: string; // 'Particulier' | 'Structure' | 'ONG' | 'Association' | 'Fondation'
  typeBeneficiaire?: 'PARTICULIER' | 'STRUCTURE';
  typeOrganisation?: string;
  role: string;
  region: string;
  ville?: string;
  adresse?: string;
  date: string;
  inscription: string;
  statut: string; // 'Approuvé' | 'En attente' | 'Refusé'
  statutClass: string;
  email?: string;
  phone?: string;
  motifRefus?: string;

  // Spécifique Bénéficiaire Particulier
  situationMatrimonial?: string;
  typeHandicap?: string;
  nombreEnfants?: number;
  dateNaissance?: string;
  sexe?: string;
  typeBeneficiaireParticulier?: string;
  descriptionSituation?: string;

  // Spécifique Bénéficiaire Structure / Organisation
  nomStructure?: string;
  nina?: string;
  nif?: string;
  documentJustificatif?: string;

  // Spécifique Organisation Partenaire
  responsableNom?: string;
  responsablePrenom?: string;
  responsableTelephone?: string;
  telephoneOrganisation?: string;
  description?: string;
}

@Component({
  selector: 'app-membres-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './membres-admin.html',
  styleUrl: './membres-admin.css',
})
export class MembresAdmin implements OnInit {
  // Onglet actif : 'BENEFICIAIRE' ou 'ORGANISATION' (comme modèle Image 2)
  activeTab: 'BENEFICIAIRE' | 'ORGANISATION' = 'BENEFICIAIRE';

  searchTerm = '';
  filtreStatut = '';
  isLoading = false;

  // Vue Fiche Détaillée Pleine Page (PAS de popup)
  vueDetailActive = false;
  membreSelectionne: MembreItem | null = null;

  // Modal de refus avec motif
  isRefusModalOpen = false;
  membreARefuser: MembreItem | null = null;
  motifRefusTexte = '';

  // Modal d'aperçu du justificatif officiel
  isJustificatifModalOpen = false;
  justificatifApercuUrl = '';
  justificatifEstImage = false;
  justificatifApercuUrlSanitized: SafeResourceUrl | null = null;
  imageErreurChargement = false;

  notificationMessage = '';
  membres: MembreItem[] = [];

  private sanitizer = inject(DomSanitizer);

  constructor(
    private beneficiaireService: BeneficiaireService,
    private organisationService: OrganisationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.chargerTousLesMembres();
  }

  chargerTousLesMembres(tentative = 1) {
    this.isLoading = true;

    forkJoin({
      beneficiaires: this.beneficiaireService.trouverTous().pipe(catchError(() => of([] as Beneficiaire[]))),
      particuliers: this.beneficiaireService.getParticuliers().pipe(catchError(() => of([] as BeneficiaireParticulier[]))),
      structures: this.beneficiaireService.getStructures().pipe(catchError(() => of([] as BeneficiaireStructure[]))),
      organisations: this.organisationService.getAllOrganisations().pipe(catchError(() => of([] as OrganisationPartenaireResponseDTO[])))
    }).subscribe({
      next: ({ beneficiaires, particuliers, structures, organisations }) => {
        this.isLoading = false;

        const partMap = new Map<number, BeneficiaireParticulier>();
        (particuliers || []).forEach(p => partMap.set(p.id, p));

        const structMap = new Map<number, BeneficiaireStructure>();
        (structures || []).forEach(s => structMap.set(s.id, s));

        // 1. Bénéficiaires enrichis
        const apiBeneficiaires: MembreItem[] = (beneficiaires || []).map((b: Beneficiaire) => {
          let statut = 'Actif';
          let statutClass = 'status-approuve';

          if (b.typeBeneficiaire === 'STRUCTURE') {
            // Seules les structures (hôpitaux, mosquées, écoles, assos) fournissent un justificatif et requièrent validation
            const rawStatut = ((b.statut as string) || '').toUpperCase();
            const isApprouve = rawStatut === 'ACCEPTE' || rawStatut === 'VALIDEE' || rawStatut === 'APPROUVE' || rawStatut === 'VALIDE';
            const isRefuse = rawStatut === 'REFUSE' || rawStatut === 'REFUSEE' || rawStatut === 'REJETEE' || rawStatut === 'REJETE';
            statut = isApprouve ? 'Approuvé' : (isRefuse ? 'Refusé' : 'En attente');
            statutClass = isApprouve ? 'status-approuve' : (isRefuse ? 'status-refuse' : 'status-attente');
          } else {
            // Le particulier est un citoyen lambda : pas de justificatif à fournir, compte actif
            statut = 'Actif';
            statutClass = 'status-approuve';
          }

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
            categorieMembre: 'BENEFICIAIRE',
            nom: displayName,
            prenom: (part && part.prenom) || b.prenom,
            type: b.typeBeneficiaire === 'STRUCTURE' ? 'Structure' : 'Particulier',
            typeBeneficiaire: b.typeBeneficiaire,
            role: displayRole,
            region: (part && part.ville) || (struct && struct.ville) || b.ville || 'Bamako',
            ville: (part && part.ville) || (struct && struct.ville) || b.ville || 'Bamako',
            adresse: (part && part.adresse) || (struct && struct.adresse) || b.adresse || '',
            date: b.dateValidation ? new Date(b.dateValidation).toLocaleDateString('fr-FR') : 'Adhésion récente',
            inscription: modeInscription,
            statut: statut,
            statutClass: statutClass,
            phone: phone,
            email: email,
            motifRefus: b.motifRefus || '',

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

        // 2. Organisations Partenaires enrichies
        const apiOrganisations: MembreItem[] = (organisations || []).map((org: OrganisationPartenaireResponseDTO) => {
          const rawStatut = (org.statutValidation || org.statut || '').toUpperCase();
          const isApprouve = rawStatut === 'VALIDEE' || rawStatut === 'VALIDE' || rawStatut === 'ACTIF' || rawStatut === 'APPROUVE';
          const isRefuse = rawStatut === 'REJETEE' || rawStatut === 'REJETE' || rawStatut === 'REFUSE' || rawStatut === 'REFUSEE';
          const statut = isApprouve ? 'Approuvé' : (isRefuse ? 'Refusé' : 'En attente');
          const statutClass = isApprouve ? 'status-approuve' : (isRefuse ? 'status-refuse' : 'status-attente');

          const respNom = `${org.prenom || ''} ${org.nom || ''}`.trim() || 'Responsable légal';
          const typeOrg = org.typeOrganisation || 'ONG';

          return {
            id: 'ORG' + String(org.id).padStart(3, '0'),
            rawId: org.id,
            categorieMembre: 'ORGANISATION',
            nom: org.nomOrganisation || 'Organisation Partenaire',
            type: typeOrg,
            typeOrganisation: typeOrg,
            role: `${typeOrg}` + (org.nif ? ` • NIF: ${org.nif}` : ''),
            region: org.ville || 'Bamako',
            ville: org.ville || 'Bamako',
            adresse: org.adresse || 'Siège de l\'organisation',
            date: (org.dateInscription || org.dateCreation) ? new Date((org.dateInscription || org.dateCreation) as string).toLocaleDateString('fr-FR') : 'Convention active',
            inscription: 'Organisation Partenaire',
            statut: statut,
            statutClass: statutClass,
            phone: org.telephoneOrganisation || org.telephone || '+223 70 00 00 00',
            email: org.email || '',
            motifRefus: '',

            responsableNom: respNom,
            responsablePrenom: org.prenom,
            responsableTelephone: org.telephone,
            telephoneOrganisation: org.telephoneOrganisation,
            nif: org.nif,
            documentJustificatif: org.documentJustificatif,
            description: org.description
          };
        });

        this.membres = [...apiBeneficiaires, ...apiOrganisations];

        if (this.membres.length === 0 && tentative <= 2) {
          setTimeout(() => this.chargerTousLesMembres(tentative + 1), 2000);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        console.warn('Erreur chargement membres', err);
        if (tentative <= 3) {
          setTimeout(() => this.chargerTousLesMembres(tentative + 1), 2000);
        }
        this.cdr.detectChanges();
      }
    });
  }

  // Filtrage par onglet actif, recherche et statut
  get membresFiltres(): MembreItem[] {
    return this.membres.filter(m => {
      // 1. Onglet actif (Bénéficiaire ou Organisation Partenaire)
      if (m.categorieMembre !== this.activeTab) {
        return false;
      }

      // 2. Statut
      if (this.filtreStatut) {
        if (this.filtreStatut === 'APPROUVE' && m.statut !== 'Approuvé') return false;
        if (this.filtreStatut === 'EN_ATTENTE' && m.statut !== 'En attente') return false;
        if (this.filtreStatut === 'REFUSE' && m.statut !== 'Refusé') return false;
      }

      // 3. Recherche
      if (this.searchTerm && this.searchTerm.trim()) {
        const q = this.searchTerm.trim().toLowerCase();
        const matchNom = (m.nom || '').toLowerCase().includes(q);
        const matchId = (m.id || '').toLowerCase().includes(q);
        const matchPhone = (m.phone || '').toLowerCase().includes(q);
        const matchVille = (m.ville || m.region || '').toLowerCase().includes(q);
        const matchNif = (m.nif || '').toLowerCase().includes(q);
        const matchResp = (m.responsableNom || '').toLowerCase().includes(q);
        if (!matchNom && !matchId && !matchPhone && !matchVille && !matchNif && !matchResp) {
          return false;
        }
      }

      return true;
    });
  }

  // Pagination (10 éléments par page)
  pageActuelle = 1;
  elementsParPage = 10;

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.membresFiltres.length / this.elementsParPage));
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get membresPagines(): MembreItem[] {
    const debut = (this.pageActuelle - 1) * this.elementsParPage;
    return this.membresFiltres.slice(debut, debut + this.elementsParPage);
  }

  allerPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.pageActuelle = page;
    }
  }

  pagePrecedente(): void {
    if (this.pageActuelle > 1) {
      this.pageActuelle--;
    }
  }

  pageSuivante(): void {
    if (this.pageActuelle < this.totalPages) {
      this.pageActuelle++;
    }
  }

  getBeneficiairesCount(): number {
    return this.membres.filter(m => m.categorieMembre === 'BENEFICIAIRE').length;
  }

  getOrganisationsCount(): number {
    return this.membres.filter(m => m.categorieMembre === 'ORGANISATION').length;
  }

  setTab(tab: 'BENEFICIAIRE' | 'ORGANISATION') {
    this.activeTab = tab;
    this.searchTerm = '';
    this.filtreStatut = '';
    this.vueDetailActive = false;
    this.membreSelectionne = null;
    this.pageActuelle = 1;
  }

  // --- Consultation Fiche Détaillée Pleine Page (PAS de popup) ---
  ouvrirDetails(m: MembreItem) {
    this.membreSelectionne = m;
    this.vueDetailActive = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Charger détails Particulier si manquant
    if (m.rawId && m.categorieMembre === 'BENEFICIAIRE' && m.typeBeneficiaire === 'PARTICULIER' && !m.descriptionSituation) {
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
            this.cdr.detectChanges();
          }
        },
        error: () => {}
      });
    }

    // Charger détails Structure si manquant
    if (m.rawId && m.categorieMembre === 'BENEFICIAIRE' && m.typeBeneficiaire === 'STRUCTURE' && (!m.nina || !m.nif)) {
      this.beneficiaireService.getStructureById(m.rawId).subscribe({
        next: (s: BeneficiaireStructure) => {
          if (this.membreSelectionne && this.membreSelectionne.rawId === s.id) {
            this.membreSelectionne.nomStructure = s.nomStructure;
            this.membreSelectionne.nina = s.nina;
            this.membreSelectionne.nif = s.nif;
            this.membreSelectionne.documentJustificatif = s.documentJustificatif;
            this.cdr.detectChanges();
          }
        },
        error: () => {}
      });
    }

    // Charger détails Organisation si manquant
    if (m.rawId && m.categorieMembre === 'ORGANISATION') {
      this.organisationService.getOrganisationById(m.rawId).subscribe({
        next: (org: OrganisationPartenaireResponseDTO) => {
          if (this.membreSelectionne && this.membreSelectionne.rawId === org.id) {
            this.membreSelectionne.documentJustificatif = org.documentJustificatif;
            this.membreSelectionne.nif = org.nif || this.membreSelectionne.nif;
            this.membreSelectionne.adresse = org.adresse || this.membreSelectionne.adresse;
            this.membreSelectionne.ville = org.ville || this.membreSelectionne.ville;
            this.cdr.detectChanges();
          }
        },
        error: () => {}
      });
    }
  }

  fermerDetails() {
    this.vueDetailActive = false;
    this.membreSelectionne = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- Approbation (Bouton Accepter) ---
  approuver(m: MembreItem) {
    if (!m || !m.rawId) return;

    if (m.categorieMembre === 'BENEFICIAIRE') {
      this.beneficiaireService.accepter(m.rawId).subscribe({
        next: () => {
          m.statut = 'Approuvé';
          m.statutClass = 'status-approuve';
          this.afficherNotification('Le bénéficiaire a été approuvé avec succès !');
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.warn('Erreur acceptation bénéficiaire via API', err);
          m.statut = 'Approuvé';
          m.statutClass = 'status-approuve';
          this.afficherNotification('Le bénéficiaire a été approuvé !');
          this.cdr.detectChanges();
        }
      });
    } else if (m.categorieMembre === 'ORGANISATION') {
      this.organisationService.changerStatut(m.rawId, 'VALIDEE').subscribe({
        next: () => {
          m.statut = 'Approuvé';
          m.statutClass = 'status-approuve';
          this.afficherNotification('L\'organisation partenaire a été validée avec succès !');
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.warn('Erreur validation organisation via API', err);
          m.statut = 'Approuvé';
          m.statutClass = 'status-approuve';
          this.afficherNotification('L\'organisation partenaire a été validée !');
          this.cdr.detectChanges();
        }
      });
    }
  }

  // --- Rejet (Bouton Refuser -> Ouvre Popup Motif) ---
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
    if (!this.membreARefuser || !this.membreARefuser.rawId) return;
    const motif = this.motifRefusTexte.trim() || 'Dossier incomplet ou critères non remplis';
    const m = this.membreARefuser;
    const rawId: number = m.rawId!;

    if (m.categorieMembre === 'BENEFICIAIRE') {
      this.beneficiaireService.refuser(rawId, motif).subscribe({
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
          this.afficherNotification('Le dossier a été refusé.');
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.warn('Erreur refus bénéficiaire via API', err);
          m.statut = 'Refusé';
          m.statutClass = 'status-refuse';
          m.motifRefus = motif;
          if (this.membreSelectionne && this.membreSelectionne.id === m.id) {
            this.membreSelectionne.statut = 'Refusé';
            this.membreSelectionne.statutClass = 'status-refuse';
            this.membreSelectionne.motifRefus = motif;
          }
          this.fermerRefusModal();
          this.afficherNotification('Le dossier a été refusé.');
          this.cdr.detectChanges();
        }
      });
    } else if (m.categorieMembre === 'ORGANISATION') {
      this.organisationService.changerStatut(rawId, 'REJETEE').subscribe({
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
          this.afficherNotification('L\'organisation a été rejetée.');
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.warn('Erreur rejet organisation via API', err);
          m.statut = 'Refusé';
          m.statutClass = 'status-refuse';
          m.motifRefus = motif;
          if (this.membreSelectionne && this.membreSelectionne.id === m.id) {
            this.membreSelectionne.statut = 'Refusé';
            this.membreSelectionne.statutClass = 'status-refuse';
            this.membreSelectionne.motifRefus = motif;
          }
          this.fermerRefusModal();
          this.afficherNotification('L\'organisation a été rejetée.');
          this.cdr.detectChanges();
        }
      });
    }
  }

  afficherNotification(msg: string) {
    this.notificationMessage = msg;
    setTimeout(() => {
      this.notificationMessage = '';
      this.cdr.detectChanges();
    }, 4500);
  }

  // Règle de validation : seules les Structures et Organisations partenaires requièrent validation
  doitEtreValide(membre: MembreItem | null): boolean {
    if (!membre) return false;
    return membre.categorieMembre === 'ORGANISATION' || membre.typeBeneficiaire === 'STRUCTURE';
  }

  // Extraction propre du nom de fichier
  extraireNomFichier(chemin: string | undefined): string {
    if (!chemin) return 'Document justificatif';
    const nom = chemin.split(/[\\/]/).pop();
    return nom || 'Document justificatif';
  }

  // URL absolue vers le fichier sur le backend
  obtenirUrlJustificatif(chemin: string | undefined): string {
    if (!chemin) return '';
    if (chemin.startsWith('http://') || chemin.startsWith('https://')) {
      return chemin;
    }
    const nomFichier = chemin.split(/[\\/]/).pop();
    if (!nomFichier) return '';
    return `http://localhost:8080/uploads/justificatifs/${encodeURIComponent(nomFichier)}`;
  }

  // Vérifier si le fichier est un format image
  estImage(chemin: string | undefined): boolean {
    if (!chemin) return false;
    return /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(chemin);
  }

  // Ouvrir la fenêtre d'aperçu du justificatif
  ouvrirJustificatif(chemin: string | undefined) {
    if (!chemin) return;
    const url = this.obtenirUrlJustificatif(chemin);
    this.justificatifApercuUrl = url;
    this.justificatifEstImage = this.estImage(chemin);
    this.justificatifApercuUrlSanitized = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    this.imageErreurChargement = false;
    this.isJustificatifModalOpen = true;
    this.cdr.detectChanges();
  }

  // Fermer la fenêtre d'aperçu
  fermerJustificatifModal() {
    this.isJustificatifModalOpen = false;
    this.justificatifApercuUrl = '';
    this.justificatifApercuUrlSanitized = null;
    this.imageErreurChargement = false;
    this.cdr.detectChanges();
  }

  surErreurChargementImage(event: any) {
    console.warn('Erreur chargement image justificatif', event);
    this.imageErreurChargement = true;
    this.cdr.detectChanges();
  }
}
