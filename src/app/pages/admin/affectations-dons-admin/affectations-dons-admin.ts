import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AttributionDonLibreService } from '../../../services/attribution-don-libre.service';
import { DonService } from '../../../services/don.service.ts';
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
      orgs: this.organisationService.getAllOrganisations().pipe(
        catchError(err => {
          console.warn('Erreur chargement organisations partenaires', err);
          return of([] as OrganisationPartenaireResponseDTO[]);
        })
      )
    }).subscribe({
      next: (res) => {
        this.attributions = res.attributions || [];
        this.financieres = this.attributions.filter(a => a.donFinancierId != null);
        this.materielles = this.attributions.filter(a => a.donMaterielId != null);

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
            totalAttribueParFinancier.set(a.donFinancierId, actuel + a.montantAttribue);
          }
          if (a.donMaterielId != null && a.quantiteAttribuee != null) {
            const actuel = totalAttribueParMateriel.get(a.donMaterielId) || 0;
            totalAttribueParMateriel.set(a.donMaterielId, actuel + a.quantiteAttribuee);
          }
        });

        // Filtrer les dons financiers spontanés (non liés à une demande d'aide)
        this.donsFinanciersSpontanes = (res.financiers || [])
          .filter(d => d.demandeAideId == null)
          .map(d => {
            const deja = totalAttribueParFinancier.get(d.id) || 0;
            const restant = Math.max(0, (d.montant || 0) - deja);
            return {
              ...d,
              totalAttribue: deja,
              montantRestant: restant
            };
          });

        // Filtrer les dons matériels spontanés (non liés à une demande d'aide)
        this.donsMaterielsSpontanes = (res.materiels || [])
          .filter(d => d.demandeAideId == null)
          .map(d => {
            const qteInitiale = d.quantiteRecue != null && d.quantiteRecue > 0 ? d.quantiteRecue : (d.quantite || 0);
            const deja = totalAttribueParMateriel.get(d.id) || 0;
            const restant = Math.max(0, qteInitiale - deja);
            return {
              ...d,
              totalAttribue: deja,
              quantiteRestante: restant
            };
          });

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
        const d = this.donFinancierSelectionne;
        if (d) this.montantAAttribuer = d.montantRestant;
      } else {
        this.donMaterielSelectionneId = preselectedDonId;
        const d = this.donMaterielSelectionne;
        if (d) this.quantiteAAttribuer = d.quantiteRestante;
      }
      this.rechercherOrganisationPrioritaire();
    }

    this.isModalAffectationOpen = true;
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
    }
  }

  get donFinancierSelectionne(): DonFinancierSpontane | undefined {
    return this.donsFinanciersSpontanes.find(d => d.id === this.donFinancierSelectionneId);
  }

  get donMaterielSelectionne(): DonMaterielSpontane | undefined {
    return this.donsMaterielsSpontanes.find(d => d.id === this.donMaterielSelectionneId);
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

  // Recommandation intelligente de l'organisation prioritaire par le backend
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

    // Validation Don Financier
    if (this.typeDonAAttribuer === 'FINANCIER') {
      if (!this.donFinancierSelectionneId) {
        this.afficherNotification('Veuillez sélectionner un don financier spontané.', 'error');
        return;
      }
      const don = this.donFinancierSelectionne;
      if (!don) {
        this.afficherNotification('Don financier introuvable.', 'error');
        return;
      }
      if (!this.montantAAttribuer || this.montantAAttribuer <= 0) {
        this.afficherNotification('Le montant à attribuer doit être supérieur à zéro.', 'error');
        return;
      }
      if (this.montantAAttribuer > don.montantRestant) {
        this.afficherNotification(`Le montant ne peut pas dépasser le solde disponible (${don.montantRestant} FCFA).`, 'error');
        return;
      }
    }

    // Validation Don Matériel
    if (this.typeDonAAttribuer === 'MATERIEL') {
      if (!this.donMaterielSelectionneId) {
        this.afficherNotification('Veuillez sélectionner un don matériel spontané.', 'error');
        return;
      }
      const don = this.donMaterielSelectionne;
      if (!don) {
        this.afficherNotification('Don matériel introuvable.', 'error');
        return;
      }
      if (!this.quantiteAAttribuer || this.quantiteAAttribuer <= 0) {
        this.afficherNotification('La quantité à attribuer doit être supérieure à zéro.', 'error');
        return;
      }
      if (this.quantiteAAttribuer > don.quantiteRestante) {
        this.afficherNotification(`La quantité ne peut pas dépasser le stock disponible (${don.quantiteRestante} ${don.unite || ''}).`, 'error');
        return;
      }
    }

    // Validation Organisation
    if (!this.organisationId) {
      this.afficherNotification('Veuillez choisir une organisation partenaire de destination.', 'error');
      return;
    }

    if (this.organisationRecommandee && this.organisationId !== this.organisationRecommandee.organisationPartenaireId) {
      this.afficherNotification(
        `Selon la règle d'attribution du système, vous devez choisir l'organisation prioritaire recommandée : ${this.organisationRecommandee.nomOrganisation}.`,
        'error'
      );
      return;
    }

    const dto: AttributionDonLibreRequest = {
      donFinancierId: this.typeDonAAttribuer === 'FINANCIER' ? this.donFinancierSelectionneId : null,
      donMaterielId: this.typeDonAAttribuer === 'MATERIEL' ? this.donMaterielSelectionneId : null,
      montantAttribue: this.typeDonAAttribuer === 'FINANCIER' ? this.montantAAttribuer : null,
      quantiteAttribuee: this.typeDonAAttribuer === 'MATERIEL' ? this.quantiteAAttribuer : null,
      organisationPartenaireId: this.organisationId
    };

    this.isSubmitting = true;

    this.attributionService.attribuer(dto, adminId).subscribe({
      next: (nouvelleAttribution) => {
        this.isSubmitting = false;
        this.fermerModalAffectation();

        const orgNom = nouvelleAttribution.nomOrganisation || 'l\'organisation partenaire';
        const msg = this.typeDonAAttribuer === 'FINANCIER'
          ? `Attribution financière de ${this.montantAAttribuer?.toLocaleString()} FCFA enregistrée avec succès pour ${orgNom}.`
          : `Attribution matérielle de ${this.quantiteAAttribuer} ${nouvelleAttribution.unite || 'unités'} enregistrée avec succès pour ${orgNom}.`;

        this.afficherNotification(msg, 'success');
        this.chargerDonnees();
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Erreur lors de l\'attribution du don libre', err);
        const detail = err.error?.message || err.error?.detail || err.error || '';
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
