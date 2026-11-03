import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AttributionDonLibreService } from '../../../services/attribution-don-libre.service';
import { DonService } from '../../../services/don.service';
import { OrganisationService } from '../../../services/organisation';
import { AuthService } from '../../../services/auth.service';

import {
  AttributionDonLibre,
  AttributionDonLibreRequest,
  OrganisationPrioritaireResponse
} from '../../../models/attribution-don-libre.model';
import { DonFinancier, DonMateriel } from '../../../models/don.model';
import { OrganisationPartenaireResponseDTO } from '../../../models/organisation.model';

export interface DonFinancierSpontane extends DonFinancier {
  totalAttribue: number;
  montantRestant: number;
}

export interface DonMaterielSpontane extends DonMateriel {
  totalAttribue: number;
  quantiteRestante: number;
}

type TypeOnglet = 'FINANCIER' | 'MATERIEL';

@Component({
  selector: 'app-affectations-dons-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatIconModule
  ],
  templateUrl: './affectations-dons-admin.html',
  styleUrl: './affectations-dons-admin.css'
})
export class AffectationsDonsAdmin implements OnInit {

  // Données principales
  attributions: AttributionDonLibre[] = [];
  financieres: AttributionDonLibre[] = [];
  materielles: AttributionDonLibre[] = [];

  donsFinanciersSpontanes: DonFinancierSpontane[] = [];
  donsMaterielsSpontanes: DonMaterielSpontane[] = [];
  organisations: OrganisationPartenaireResponseDTO[] = [];

  // États d'affichage
  chargement = true;
  erreur = false;
  erreurMessage = '';

  // Onglet affiché
  ongletActif: TypeOnglet = 'FINANCIER';

  // Fenêtre de détails (identique à l'organisation partenaire)
  detailsOuverts = false;
  typeDetails: TypeOnglet = 'FINANCIER';
  detailFinancier: AttributionDonLibre | null = null;
  detailMateriel: AttributionDonLibre | null = null;

  // Fenêtre modale d'affectation (logique métier Admin)
  isModalAffectationOpen = false;
  typeDonAAttribuer: TypeOnglet = 'FINANCIER';
  donFinancierSelectionneId: number | null = null;
  donMaterielSelectionneId: number | null = null;
  organisationId: number | null = null;
  montantAAttribuer: number | null = null;
  quantiteAAttribuer: number | null = null;

  // Recommandation intelligente
  isFetchingPriority = false;
  organisationRecommandee: OrganisationPrioritaireResponse | null = null;
  erreurRecommandation = '';

  // Soumission
  isSubmitting = false;

  // Notification Toast en haut de l'écran
  notificationMessage = '';
  notificationType: 'success' | 'error' = 'success';
  private notificationTimer: any = null;

  constructor(
    private attributionService: AttributionDonLibreService,
    private donService: DonService,
    private organisationService: OrganisationService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.chargerDonnees();
  }

  // ========================================================================
  // CHARGEMENT COMPLET DES DONNÉES
  // ========================================================================
  chargerDonnees(): void {
    this.chargement = true;
    this.erreur = false;

    forkJoin({
      attributions: this.attributionService.getAll().pipe(
        catchError(err => {
          console.warn('Erreur chargement attributions dons libres', err);
          return of([] as AttributionDonLibre[]);
        })
      ),
      financiers: this.donService.getAllDonsFinanciers().pipe(
        catchError(err => {
          console.warn('Erreur chargement dons financiers', err);
          return of([] as DonFinancier[]);
        })
      ),
      materiels: this.donService.getAllDonsMateriels().pipe(
        catchError(err => {
          console.warn('Erreur chargement dons matériels', err);
          return of([] as DonMateriel[]);
        })
      ),
      globaux: this.donService.getAllDons().pipe(
        catchError(err => {
          console.warn('Erreur chargement dons globaux', err);
          return of([] as any[]);
        })
      ),
      orgs: this.organisationService.getAllOrganisations().pipe(
        catchError(err => {
          console.warn('Erreur chargement organisations partenaires', err);
          return of([] as OrganisationPartenaireResponseDTO[]);
        })
      )
    }).subscribe({
      next: (res) => {
        // Parsing robuste des attributions
        this.attributions = (res.attributions || []).map((a: any) => {
          const donFinId = a.donFinancierId ?? a.donFinancier?.id ?? (a.typeDon === 'FINANCIER' || a.montantAttribue != null || a.montant != null ? (a.donId ?? a.don?.id) : null);
          const donMatId = a.donMaterielId ?? a.donMateriel?.id ?? (a.typeDon === 'MATERIEL' || a.quantiteAttribuee != null || a.quantite != null ? (a.donId ?? a.don?.id) : null);
          const mnt = a.montantAttribue ?? a.montant ?? null;
          const qte = a.quantiteAttribuee ?? a.quantite ?? null;
          const orgId = a.organisationPartenaireId ?? a.organisationId ?? a.organisationPartenaire?.id ?? null;
          const orgNom = a.nomOrganisation || a.organisationPartenaireNom || a.organisationPartenaire?.nomOrganisation || (orgId ? `Organisation ${orgId}` : 'Organisation Partenaire');

          return {
            ...a,
            id: a.id,
            donFinancierId: donFinId,
            donMaterielId: donMatId,
            montantAttribue: mnt != null ? Number(mnt) : null,
            quantiteAttribuee: qte != null ? Number(qte) : null,
            organisationPartenaireId: orgId,
            nomOrganisation: orgNom,
            designation: a.designation || a.donMateriel?.designation || 'Don matériel',
            unite: (a.unite && !a.unite.toLowerCase().includes('lot')) ? a.unite : 'unités',
            scorePriorite: a.scorePriorite ?? null,
            dateAttribution: a.dateAttribution || ''
          };
        });

        this.financieres = this.attributions.filter(a => a.donFinancierId != null || (a.montantAttribue != null && a.donMaterielId == null));
        this.materielles = this.attributions.filter(a => a.donMaterielId != null || (a.quantiteAttribuee != null && a.donFinancierId == null));

        // Ne garder que les organisations partenaires validées
        this.organisations = (res.orgs || []).filter(o =>
          !o.statutValidation || o.statutValidation === 'VALIDEE'
        );

        // Map des montants attribués par Don Financier
        const totalAttribueParFinancier = new Map<number, number>();
        // Map des quantités attribuées par Don Matériel
        const totalAttribueParMateriel = new Map<number, number>();

        this.attributions.forEach(a => {
          if (a.donFinancierId != null && a.montantAttribue != null) {
            const actuel = totalAttribueParFinancier.get(a.donFinancierId) || 0;
            totalAttribueParFinancier.set(a.donFinancierId, actuel + Number(a.montantAttribue));
          }
          if (a.donMaterielId != null && a.quantiteAttribuee != null) {
            const actuel = totalAttribueParMateriel.get(a.donMaterielId) || 0;
            totalAttribueParMateriel.set(a.donMaterielId, actuel + Number(a.quantiteAttribuee));
          }
        });

        // Détection stricte des dons liés à une demande d'aide
        const estLieADemande = (d: any): boolean => {
          if (d.demandeAideId != null && d.demandeAideId !== 0) return true;
          if (d.demandeAide != null) return true;
          if (d.demande != null) return true;
          if (d.demandeId != null && d.demandeId !== 0) return true;
          if (d.titreDemandeAide &&
              d.titreDemandeAide !== 'Don direct' &&
              d.titreDemandeAide !== 'Aide solidaire' &&
              !d.titreDemandeAide.toLowerCase().includes('libre') &&
              !d.titreDemandeAide.toLowerCase().includes('direct')) {
            return true;
          }
          return false;
        };

        // 1. Dons financiers spontanés (strictement non liés à une demande d'aide)
        const tousFinanciers = [...(res.financiers || [])];
        const seenFinIds = new Set(tousFinanciers.map(f => f.id));
        (res.globaux || []).forEach((g: any) => {
          if ((g.typeDon === 'FINANCIER' || (!g.typeDon && g.montant)) && !seenFinIds.has(g.id)) {
            tousFinanciers.push({
              id: g.id,
              montant: g.montant || 0,
              modePaiement: g.modePaiement || 'Orange Money',
              dateDon: g.dateDon || '',
              anonyme: !!g.anonyme,
              typeDon: 'FINANCIER',
              statut: g.statut || 'Terminé',
              donateurId: g.donateurId || null,
              demandeAideId: g.demandeAideId || g.demandeAide?.id || g.demande?.id || null,
              titreDemandeAide: g.titreDemandeAide || g.demandeAide?.titre || g.demande?.titre || null
            });
            seenFinIds.add(g.id);
          }
        });

        // Retirer complètement les dons déjà attribués (ne garder que ceux dont le solde restant > 0)
        this.donsFinanciersSpontanes = tousFinanciers
          .filter(d => !estLieADemande(d))
          .map(d => {
            const deja = totalAttribueParFinancier.get(d.id) || 0;
            const montantInitial = Number(d.montant) || 0;
            const restant = Math.max(0, montantInitial - deja);
            return {
              ...d,
              montant: montantInitial,
              totalAttribue: deja,
              montantRestant: restant
            };
          })
          .filter(d => d.montantRestant > 0);

        // 2. Dons matériels spontanés (strictement non liés à une demande d'aide)
        const tousMateriels = [...(res.materiels || [])];
        const seenMatIds = new Set(tousMateriels.map(m => m.id));
        (res.globaux || []).forEach((g: any) => {
          if (g.typeDon === 'MATERIEL' && !seenMatIds.has(g.id)) {
            tousMateriels.push({
              id: g.id,
              designation: g.designation || 'Don matériel',
              quantite: g.quantite || 1,
              unite: (g.unite && !g.unite.toLowerCase().includes('lot')) ? g.unite : 'unités',
              etatMateriel: 'BON',
              statutReception: g.statut || 'RECUE',
              quantiteRecue: g.quantite || 1,
              adresseLivraison: g.adresseLivraison || 'Dépôt Siège',
              dateDon: g.dateDon || '',
              anonyme: !!g.anonyme,
              donateurId: g.donateurId || null,
              demandeAideId: g.demandeAideId || g.demandeAide?.id || g.demande?.id || null,
              titreDemandeAide: g.titreDemandeAide || g.demandeAide?.titre || g.demande?.titre || null
            });
            seenMatIds.add(g.id);
          }
        });

        // Retirer complètement les dons matériels déjà attribués (ne garder que stock restant > 0)
        this.donsMaterielsSpontanes = tousMateriels
          .filter(d => !estLieADemande(d))
          .map(d => {
            const qteInitiale = Number(d.quantiteRecue != null && d.quantiteRecue > 0 ? d.quantiteRecue : (d.quantite || 0));
            const deja = totalAttribueParMateriel.get(d.id) || 0;
            const restant = Math.max(0, qteInitiale - deja);
            const unitePropre = (d.unite && !d.unite.toLowerCase().includes('lot')) ? d.unite : 'unités';
            return {
              ...d,
              quantite: qteInitiale,
              unite: unitePropre,
              totalAttribue: deja,
              quantiteRestante: restant
            };
          })
          .filter(d => d.quantiteRestante > 0);

        this.chargement = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur globale lors du chargement des affectations', err);
        this.erreur = true;
        this.erreurMessage = 'Impossible de charger les affectations.';
        this.chargement = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Pagination (10 éléments par page)
  pageActuelleFinanciere = 1;
  pageActuelleMaterielle = 1;
  elementsParPage = 10;

  get totalPagesFinancieres(): number {
    return Math.max(1, Math.ceil(this.financieres.length / this.elementsParPage));
  }

  get pagesFinancieres(): number[] {
    return Array.from({ length: this.totalPagesFinancieres }, (_, i) => i + 1);
  }

  get financieresPaginees(): AttributionDonLibre[] {
    const debut = (this.pageActuelleFinanciere - 1) * this.elementsParPage;
    return this.financieres.slice(debut, debut + this.elementsParPage);
  }

  get totalPagesMaterielles(): number {
    return Math.max(1, Math.ceil(this.materielles.length / this.elementsParPage));
  }

  get pagesMaterielles(): number[] {
    return Array.from({ length: this.totalPagesMaterielles }, (_, i) => i + 1);
  }

  get materiellesPaginees(): AttributionDonLibre[] {
    const debut = (this.pageActuelleMaterielle - 1) * this.elementsParPage;
    return this.materielles.slice(debut, debut + this.elementsParPage);
  }

  allerPageFinanciere(page: number): void {
    if (page >= 1 && page <= this.totalPagesFinancieres) {
      this.pageActuelleFinanciere = page;
    }
  }

  pagePrecedenteFinanciere(): void {
    if (this.pageActuelleFinanciere > 1) {
      this.pageActuelleFinanciere--;
    }
  }

  pageSuivanteFinanciere(): void {
    if (this.pageActuelleFinanciere < this.totalPagesFinancieres) {
      this.pageActuelleFinanciere++;
    }
  }

  allerPageMaterielle(page: number): void {
    if (page >= 1 && page <= this.totalPagesMaterielles) {
      this.pageActuelleMaterielle = page;
    }
  }

  pagePrecedenteMaterielle(): void {
    if (this.pageActuelleMaterielle > 1) {
      this.pageActuelleMaterielle--;
    }
  }

  pageSuivanteMaterielle(): void {
    if (this.pageActuelleMaterielle < this.totalPagesMaterielles) {
      this.pageActuelleMaterielle++;
    }
  }

  // Changer d'onglet principal
  changerOnglet(onglet: TypeOnglet): void {
    this.ongletActif = onglet;
    this.pageActuelleFinanciere = 1;
    this.pageActuelleMaterielle = 1;
  }

  // ========================================================================
  // CONSULTATION DES DÉTAILS (IDENTIQUE À L'ORGANISATION PARTENAIRE)
  // ========================================================================
  voirDetailsFinanciers(affectation: AttributionDonLibre): void {
    this.detailFinancier = affectation;
    this.detailMateriel = null;
    this.typeDetails = 'FINANCIER';
    this.detailsOuverts = true;
  }

  voirDetailsMateriels(affectation: AttributionDonLibre): void {
    this.detailMateriel = affectation;
    this.detailFinancier = null;
    this.typeDetails = 'MATERIEL';
    this.detailsOuverts = true;
  }

  fermerDetails(): void {
    this.detailsOuverts = false;
    this.detailFinancier = null;
    this.detailMateriel = null;
  }

  // ========================================================================
  // FORMULAIRE D'AFFECTATION D'UN DON LIBRE (LOGIQUE MÉTIER ADMIN)
  // ========================================================================
  ouvrirModalAffectation(type?: TypeOnglet, preselectedDonId?: number): void {
    this.typeDonAAttribuer = type || 'FINANCIER';
    this.donFinancierSelectionneId = null;
    this.donMaterielSelectionneId = null;
    this.organisationId = null;
    this.montantAAttribuer = null;
    this.quantiteAAttribuer = null;
    this.organisationRecommandee = null;
    this.erreurRecommandation = '';
    this.isSubmitting = false;

    if (preselectedDonId != null) {
      if (this.typeDonAAttribuer === 'FINANCIER') {
        this.donFinancierSelectionneId = preselectedDonId;
      } else {
        this.donMaterielSelectionneId = preselectedDonId;
      }
    } else {
      // Pré-sélectionner automatiquement le premier don libre disponible
      if (this.typeDonAAttribuer === 'FINANCIER' && this.donsFinanciersSpontanes.length > 0) {
        this.donFinancierSelectionneId = this.donsFinanciersSpontanes[0].id;
      } else if (this.typeDonAAttribuer === 'MATERIEL' && this.donsMaterielsSpontanes.length > 0) {
        this.donMaterielSelectionneId = this.donsMaterielsSpontanes[0].id;
      }
    }

    if (this.donFinancierSelectionneId != null || this.donMaterielSelectionneId != null) {
      this.onDonSelectionChange();
    }

    this.isModalAffectationOpen = true;
    this.cdr.detectChanges();
  }

  fermerModalAffectation(): void {
    this.isModalAffectationOpen = false;
  }

  changerTypeDon(type: TypeOnglet): void {
    if (this.typeDonAAttribuer !== type) {
      this.typeDonAAttribuer = type;
      this.donFinancierSelectionneId = null;
      this.donMaterielSelectionneId = null;
      this.organisationId = null;
      this.montantAAttribuer = null;
      this.quantiteAAttribuer = null;
      this.organisationRecommandee = null;
      this.erreurRecommandation = '';

      // Pré-sélectionner le premier don disponible du type sélectionné
      if (type === 'FINANCIER' && this.donsFinanciersSpontanes.length > 0) {
        this.donFinancierSelectionneId = this.donsFinanciersSpontanes[0].id;
        this.onDonSelectionChange();
      } else if (type === 'MATERIEL' && this.donsMaterielsSpontanes.length > 0) {
        this.donMaterielSelectionneId = this.donsMaterielsSpontanes[0].id;
        this.onDonSelectionChange();
      }
    }
  }

  get donFinancierSelectionne(): DonFinancierSpontane | undefined {
    return this.donsFinanciersSpontanes.find(d => d.id === this.donFinancierSelectionneId);
  }

  get donMaterielSelectionne(): DonMaterielSpontane | undefined {
    return this.donsMaterielsSpontanes.find(d => d.id === this.donMaterielSelectionneId);
  }

  // Liste ordonnée selon l'algorithme de priorité du backend (Priorité N°1 en tête)
  get organisationsTrieesParPriorite(): (OrganisationPartenaireResponseDTO & { estPrioritaire?: boolean; score?: number })[] {
    if (!this.organisations || this.organisations.length === 0) return [];

    const prioriteId = this.organisationRecommandee?.organisationPartenaireId;
    const score = this.organisationRecommandee?.scorePriorite;

    return [...this.organisations].sort((a, b) => {
      if (a.id === prioriteId) return -1;
      if (b.id === prioriteId) return 1;
      return (a.nomOrganisation || '').localeCompare(b.nomOrganisation || '');
    }).map(org => ({
      ...org,
      estPrioritaire: org.id === prioriteId,
      score: org.id === prioriteId ? score : undefined
    }));
  }

  onDonSelectionChange(): void {
    this.organisationRecommandee = null;
    this.erreurRecommandation = '';

    if (this.typeDonAAttribuer === 'FINANCIER') {
      const don = this.donFinancierSelectionne;
      if (don && don.montantRestant > 0) {
        this.montantAAttribuer = don.montantRestant;
      } else {
        this.montantAAttribuer = null;
      }
    } else {
      const don = this.donMaterielSelectionne;
      if (don && don.quantiteRestante > 0) {
        this.quantiteAAttribuer = don.quantiteRestante;
      } else {
        this.quantiteAAttribuer = null;
      }
    }

    this.rechercherOrganisationPrioritaire();
  }

  // Algorithme de priorisation du backend : trouve l'organisation partenaire ayant le meilleur score
  rechercherOrganisationPrioritaire(): void {
    const finId = this.typeDonAAttribuer === 'FINANCIER' ? this.donFinancierSelectionneId : null;
    const matId = this.typeDonAAttribuer === 'MATERIEL' ? this.donMaterielSelectionneId : null;

    if (!finId && !matId) {
      return;
    }

    this.isFetchingPriority = true;
    this.erreurRecommandation = '';

    this.attributionService.trouverOrganisationPrioritaire(finId, matId).subscribe({
      next: (recommandation) => {
        this.isFetchingPriority = false;
        this.organisationRecommandee = recommandation;
        if (recommandation && recommandation.organisationPartenaireId) {
          // Présélection automatique de l'organisation prioritaire déterminée par le backend
          this.organisationId = recommandation.organisationPartenaireId;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isFetchingPriority = false;
        console.warn('Aucune organisation prioritaire identifiée automatiquement', err);
        const detail = err.error?.message || err.error?.detail || '';
        this.erreurRecommandation = detail || 'Aucune organisation prioritaire identifiée pour ce don.';
        this.cdr.detectChanges();
      }
    });
  }

  appliquerOrganisationRecommandee(): void {
    if (this.organisationRecommandee) {
      this.organisationId = this.organisationRecommandee.organisationPartenaireId;
    }
  }

  attribuerToutLeSolde(): void {
    if (this.typeDonAAttribuer === 'FINANCIER' && this.donFinancierSelectionne) {
      this.montantAAttribuer = this.donFinancierSelectionne.montantRestant;
    } else if (this.typeDonAAttribuer === 'MATERIEL' && this.donMaterielSelectionne) {
      this.quantiteAAttribuer = this.donMaterielSelectionne.quantiteRestante;
    }
  }

  soumettreAffectation(): void {
    const adminUser = this.authService.getCurrentUser();
    const adminId = adminUser?.id || 1;

    // 1. Validation Don Financier
    if (this.typeDonAAttribuer === 'FINANCIER') {
      if (!this.donFinancierSelectionneId) {
        this.afficherNotification('Veuillez sélectionner un don financier libre disponible.', 'error');
        return;
      }
      const don = this.donFinancierSelectionne;
      if (!don) {
        this.afficherNotification('Don financier introuvable.', 'error');
        return;
      }
      const montantSaisi = Number(this.montantAAttribuer);
      if (isNaN(montantSaisi) || montantSaisi <= 0) {
        this.afficherNotification('Le montant à attribuer doit être supérieur à zéro.', 'error');
        return;
      }
      if (montantSaisi > don.montantRestant) {
        this.afficherNotification(
          `Le montant demandé (${montantSaisi.toLocaleString('fr-FR')} FCFA) dépasse le solde disponible de ce don (${don.montantRestant.toLocaleString('fr-FR')} FCFA).`,
          'error'
        );
        return;
      }
    }

    // 2. Validation Don Matériel
    if (this.typeDonAAttribuer === 'MATERIEL') {
      if (!this.donMaterielSelectionneId) {
        this.afficherNotification('Veuillez sélectionner un don matériel libre disponible.', 'error');
        return;
      }
      const don = this.donMaterielSelectionne;
      if (!don) {
        this.afficherNotification('Don matériel introuvable.', 'error');
        return;
      }
      const qteSaisie = Number(this.quantiteAAttribuer);
      if (isNaN(qteSaisie) || qteSaisie <= 0) {
        this.afficherNotification('La quantité à attribuer doit être supérieure à zéro.', 'error');
        return;
      }
      if (qteSaisie > don.quantiteRestante) {
        this.afficherNotification(
          `La quantité demandée (${qteSaisie}) dépasse le stock disponible (${don.quantiteRestante} ${don.unite || 'unités'}).`,
          'error'
        );
        return;
      }
    }

    // 3. Validation Organisation
    if (!this.organisationId) {
      this.afficherNotification('Veuillez sélectionner une organisation partenaire attributaire.', 'error');
      return;
    }

    // 4. Règle stricte du backend : L'organisation choisie DOIT être l'organisation prioritaire
    if (this.organisationRecommandee && this.organisationId !== this.organisationRecommandee.organisationPartenaireId) {
      this.afficherNotification(
        `Vous devez choisir l'organisation prioritaire (${this.organisationRecommandee.nomOrganisation}) selon les règles du système.`,
        'error'
      );
      this.organisationId = this.organisationRecommandee.organisationPartenaireId;
      return;
    }

    const dto: AttributionDonLibreRequest = {
      donFinancierId: this.typeDonAAttribuer === 'FINANCIER' ? Number(this.donFinancierSelectionneId) : null,
      donMaterielId: this.typeDonAAttribuer === 'MATERIEL' ? Number(this.donMaterielSelectionneId) : null,
      montantAttribue: this.typeDonAAttribuer === 'FINANCIER' ? Number(this.montantAAttribuer) : null,
      quantiteAttribuee: this.typeDonAAttribuer === 'MATERIEL' ? Math.floor(Number(this.quantiteAAttribuer)) : null,
      organisationPartenaireId: Number(this.organisationId)
    };

    this.isSubmitting = true;

    this.attributionService.attribuer(dto, Number(adminId)).subscribe({
      next: (nouvelleAttribution) => {
        this.isSubmitting = false;
        this.fermerModalAffectation();

        const orgNom = nouvelleAttribution.nomOrganisation || this.organisationRecommandee?.nomOrganisation || 'l\'organisation partenaire';
        const msg = this.typeDonAAttribuer === 'FINANCIER'
          ? `Attribution financière de ${Number(this.montantAAttribuer).toLocaleString('fr-FR')} FCFA enregistrée avec succès pour ${orgNom}.`
          : `Attribution matérielle de ${this.quantiteAAttribuer} ${nouvelleAttribution.unite || 'unités'} enregistrée avec succès pour ${orgNom}.`;

        this.afficherNotification(msg, 'success');
        this.chargerDonnees();
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Erreur lors de l\'attribution du don libre', err);
        const detail = err.error?.message || err.error?.detail || (typeof err.error === 'string' ? err.error : '') || err.message || '';
        const msg = typeof detail === 'string' && detail.length > 0
          ? detail
          : 'Une erreur est survenue lors de l\'enregistrement de l\'attribution.';
        this.afficherNotification(msg, 'error');
        this.cdr.detectChanges();
      }
    });
  }

  // ========================================================================
  // NOTIFICATION TOAST EN HAUT DE L'ÉCRAN
  // ========================================================================
  afficherNotification(message: string, type: 'success' | 'error' = 'success'): void {
    if (this.notificationTimer) {
      clearTimeout(this.notificationTimer);
    }
    this.notificationMessage = message;
    this.notificationType = type;
    this.cdr.detectChanges();

    this.notificationTimer = setTimeout(() => {
      this.fermerNotification();
    }, 6000);
  }

  fermerNotification(): void {
    this.notificationMessage = '';
    if (this.notificationTimer) {
      clearTimeout(this.notificationTimer);
      this.notificationTimer = null;
    }
    this.cdr.detectChanges();
  }
}
