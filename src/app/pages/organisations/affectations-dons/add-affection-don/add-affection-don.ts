import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin, finalize } from 'rxjs';

import { AuthService } from '../../../../services/auth.service';
import { demandeAideService } from '../../../../services/demande-aide';
import { BeneficiaireService } from '../../../../services/beneficiaire';
import { AttributionDonService } from '../../../../services/attribution-don';
import { AffectationDonService } from '../../../../services/affectation-don';
import { AffectationDonMaterielService } from '../../../../services/affectation-don-materiel';
import { NotificationService } from '../../../../services/notification';

import { Demande } from '../../../../models/demande.model';
import { Beneficiaire } from '../../../../models/beneficiaire.model';
import { AttributionDon } from '../../../../models/attribution-don.model';
import { AffectationDonRequest } from '../../../../models/affectation-don.model';
import { AffectationDonMaterielRequest } from '../../../../models/affectation-don-materiel.model';

interface AttributionDonAPI extends AttributionDon {
  donFinancierId?: number | null;
  donMaterielId?: number | null;
  unite?: string | null;
}

@Component({
  selector: 'app-add-affection-don',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatIconModule
  ],
  templateUrl: './add-affection-don.html',
  styleUrl: './add-affection-don.css'
})
export class AddAffectionDon implements OnInit {

  typeAide: 'FINANCIER' | 'MATERIEL' = 'FINANCIER';
  modeAffectation: 'DEMANDE' | 'BENEFICIAIRE' = 'DEMANDE';

  demandes: Demande[] = [];
  beneficiaires: Beneficiaire[] = [];
  dons: AttributionDon[] = [];

  demandeAideId: number | null = null;
  beneficiaireId: number | null = null;
  donId: number | null = null;

  montantAffecte: number | null = null;
  quantiteAffectee: number | null = null;

  unite = '';
  unitePersonnalisee = '';
  utiliserUnitePersonnalisee = false;

  readonly unitesDisponibles = [
    'Sac',
    'Carton',
    'Bidon',
    'Pièce',
    'Kit',
    'Lot',
    'Paquet',
    'Bouteille',
    'Paire'
  ];

  rechercheDemande = '';
  rechercheBeneficiaire = '';
  rechercheDon = '';

  listeDemandesOuverte = false;
  listeBeneficiairesOuverte = false;
  listeDonsOuverte = false;

  // Fenêtre de confirmation
  confirmationOuverte = false;

  // Erreurs affichées sous chaque champ
  erreurMontant = '';
  erreurQuantite = '';
  erreurUnite = '';
  erreurDemande = '';
  erreurBeneficiaire = '';
  erreurDon = '';

  erreur = '';
  chargement = false;
  chargementInitial = true;

  private organisationId: number | null = null;

  private affectationsFinancieres: any[] = [];
  private affectationsMaterielles: any[] = [];

  constructor(
    private authService: AuthService,
    private demandeService: demandeAideService,
    private beneficiaireService: BeneficiaireService,
    private attributionService: AttributionDonService,
    private affectationService: AffectationDonService,
    private affectationMaterielService: AffectationDonMaterielService,
    private notificationService: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const utilisateur = this.authService.getCurrentUser();
    const id = Number(utilisateur?.id);

    if (!Number.isInteger(id) || id <= 0) {
      this.erreur = 'Impossible de récupérer votre organisation.';
      this.chargementInitial = false;
      this.cdr.detectChanges();
      return;
    }

    this.organisationId = id;
    this.chargerDonnees();
  }

  chargerDonnees(): void {
    if (this.organisationId === null) {
      this.chargementInitial = false;
      this.cdr.detectChanges();
      return;
    }

    this.chargementInitial = true;
    this.cdr.detectChanges();

    forkJoin({
      demandes: this.demandeService
        .getDemandesDisponiblesPourDon(this.organisationId),

      beneficiaires: this.beneficiaireService
        .trouverAcceptesParOrganisation(this.organisationId),

      dons: this.attributionService
        .getParOrganisation(this.organisationId),

      financieres: this.affectationService
        .getAffectationsFinancieres(),

      materielles: this.affectationService
        .getAffectationsMaterielles()
    })
      .pipe(
        finalize(() => {
          this.chargementInitial = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (resultat) => {
          this.demandes = (resultat.demandes ?? []).filter(
            demande =>
              demande.statut === 'VALIDEE' &&
              demande.statutCollecte !== 'TERMINEE'
          );

          this.beneficiaires = (resultat.beneficiaires ?? []).filter(
            beneficiaire => beneficiaire.statut === 'ACCEPTE'
          );

          this.dons = this.normaliserDons(resultat.dons ?? []);

          this.affectationsFinancieres = resultat.financieres ?? [];
          this.affectationsMaterielles = resultat.materielles ?? [];

          this.cdr.detectChanges();
        },

        error: (err) => {
          console.error('Erreur de chargement :', err);
          console.error('URL en erreur :', err.url);
          console.error('Statut HTTP :', err.status);

          this.erreur =
            'Impossible de charger les données. Vérifiez le serveur et les services.';

          this.cdr.detectChanges();
        }
      });
  }

  private normaliserDons(data: AttributionDon[]): AttributionDon[] {
    return (data as AttributionDonAPI[])
      .map(don => {
        const estFinancier = don.donFinancierId != null;
        const estMateriel = don.donMaterielId != null;

        const typeDon = estFinancier
          ? 'FINANCIER'
          : estMateriel
            ? 'MATERIEL'
            : don.typeDon;

        const idReel = estFinancier
          ? don.donFinancierId
          : estMateriel
            ? don.donMaterielId
            : don.donId;

        return {
          ...don,
          donId: Number(idReel),
          typeDon,
          unite: don.unite ?? ''
        } as AttributionDon;
      })
      .filter(don =>
        Number.isInteger(don.donId) &&
        don.donId > 0 &&
        (
          (don.typeDon === 'FINANCIER' &&
            Number(don.montantAttribue) > 0) ||
          (don.typeDon === 'MATERIEL' &&
            Number(don.quantiteAttribuee) > 0)
        )
      );
  }

  // Listes déroulantes
  ouvrirListeDemandes(): void {
    this.listeDemandesOuverte = true;
    this.listeBeneficiairesOuverte = false;
    this.listeDonsOuverte = false;
    this.cdr.detectChanges();
  }

  ouvrirListeBeneficiaires(): void {
    this.listeBeneficiairesOuverte = true;
    this.listeDemandesOuverte = false;
    this.listeDonsOuverte = false;
    this.cdr.detectChanges();
  }

  ouvrirListeDons(): void {
    this.listeDonsOuverte = true;
    this.listeDemandesOuverte = false;
    this.listeBeneficiairesOuverte = false;
    this.cdr.detectChanges();
  }

  fermerListes(): void {
    this.listeDemandesOuverte = false;
    this.listeBeneficiairesOuverte = false;
    this.listeDonsOuverte = false;
    this.cdr.detectChanges();
  }

  // Statistiques
  get donsFinanciersDisponibles(): number {
    return this.dons.filter(
      don =>
        don.typeDon === 'FINANCIER' &&
        this.getMontantDisponible(don) > 0
    ).length;
  }

  get donsMaterielsDisponibles(): number {
    return this.dons.filter(
      don =>
        don.typeDon === 'MATERIEL' &&
        this.getQuantiteDisponible(don) > 0
    ).length;
  }

  // Données filtrées
  get demandesFiltrees(): Demande[] {
    const recherche = this.rechercheDemande.trim().toLowerCase();

    return this.demandes.filter(demande =>
      (demande.titre || '').toLowerCase().includes(recherche)
    );
  }

  get beneficiairesFiltres(): Beneficiaire[] {
    const recherche = this.rechercheBeneficiaire.trim().toLowerCase();

    return this.beneficiaires.filter(beneficiaire => {
      const nom = (beneficiaire.nom || '').toLowerCase();
      const prenom = (beneficiaire.prenom || '').toLowerCase();
      const telephone = (beneficiaire.telephone || '').toLowerCase();

      return `${prenom} ${nom} ${telephone}`.includes(recherche);
    });
  }

  get donsFiltres(): AttributionDon[] {
    const recherche = this.rechercheDon.trim().toLowerCase();

    return this.dons.filter(don => {
      if (don.typeDon !== this.typeAide) {
        return false;
      }

      const texte = [
        don.donId,
        don.designation,
        don.motif
      ]
        .filter(value => value !== null && value !== undefined)
        .join(' ')
        .toLowerCase();

      return texte.includes(recherche) && this.getDisponible(don) > 0;
    });
  }

  get donSelectionne(): AttributionDon | undefined {
    return this.dons.find(
      don =>
        don.typeDon === this.typeAide &&
        Number(don.donId) === Number(this.donId)
    );
  }

  get demandeSelectionnee(): Demande | undefined {
    return this.demandes.find(
      demande => Number(demande.id) === Number(this.demandeAideId)
    );
  }

  get montantRestantDemandeSelectionnee(): number | null {
    const demande = this.demandeSelectionnee;

    if (!demande) {
      return null;
    }

    return Math.max(
      0,
      Number(demande.montantNecessaire || 0) -
      Number(demande.montantCollecte || 0)
    );
  }

  get uniteFinale(): string {
    return this.utiliserUnitePersonnalisee
      ? this.unitePersonnalisee.trim()
      : this.unite.trim();
  }

  getDisponible(don: AttributionDon): number {
    return don.typeDon === 'FINANCIER'
      ? this.getMontantDisponible(don)
      : this.getQuantiteDisponible(don);
  }

  getMontantDisponible(don: AttributionDon): number {
    const dejaAffecte = this.affectationsFinancieres
      .filter(affectation =>
        Number(affectation.donFinancierId) === Number(don.donId)
      )
      .reduce(
        (total, affectation) =>
          total + Number(affectation.montantAffecte || 0),
        0
      );

    return Math.max(
      0,
      Number(don.montantAttribue || 0) - dejaAffecte
    );
  }

  getQuantiteDisponible(don: AttributionDon): number {
    const dejaAffectee = this.affectationsMaterielles
      .filter(affectation =>
        Number(affectation.donMaterielId) === Number(don.donId)
      )
      .reduce(
        (total, affectation) =>
          total + Number(affectation.quantiteAffectee || 0),
        0
      );

    return Math.max(
      0,
      Number(don.quantiteAttribuee || 0) - dejaAffectee
    );
  }

  // Sélection
  selectionnerDemande(demande: Demande): void {
    this.demandeAideId = demande.id;
    this.beneficiaireId = null;

    this.rechercheDemande = demande.titre;
    this.rechercheBeneficiaire = '';

    this.listeDemandesOuverte = false;
    this.listeBeneficiairesOuverte = false;

    this.erreurDemande = '';
    this.erreurBeneficiaire = '';

    this.cdr.detectChanges();
  }

  selectionnerBeneficiaire(beneficiaire: Beneficiaire): void {
    this.beneficiaireId = beneficiaire.id;
    this.demandeAideId = null;

    this.rechercheBeneficiaire =
      `${beneficiaire.prenom} ${beneficiaire.nom}`;
    this.rechercheDemande = '';

    this.listeBeneficiairesOuverte = false;
    this.listeDemandesOuverte = false;

    this.erreurDemande = '';
    this.erreurBeneficiaire = '';

    this.cdr.detectChanges();
  }

  selectionnerDon(don: AttributionDon): void {
    this.donId = don.donId;
    this.rechercheDon = `Don #${don.donId}`;
    this.listeDonsOuverte = false;

    this.erreurDon = '';

    const uniteDon = (don as AttributionDonAPI).unite;

    if (this.typeAide === 'MATERIEL' && uniteDon) {
      const uniteExistante = this.unitesDisponibles.find(
        unite => unite.toLowerCase() === uniteDon.toLowerCase()
      );

      if (uniteExistante) {
        this.unite = uniteExistante;
        this.utiliserUnitePersonnalisee = false;
        this.unitePersonnalisee = '';
      } else {
        this.unite = 'AUTRE';
        this.utiliserUnitePersonnalisee = true;
        this.unitePersonnalisee = uniteDon;
      }
    }

    this.effacerErreursChamps();
    this.cdr.detectChanges();
  }

  changerType(type: 'FINANCIER' | 'MATERIEL'): void {
    this.typeAide = type;
    this.donId = null;
    this.montantAffecte = null;
    this.quantiteAffectee = null;

    this.unite = '';
    this.unitePersonnalisee = '';
    this.utiliserUnitePersonnalisee = false;

    this.rechercheDon = '';
    this.listeDonsOuverte = false;

    this.effacerErreursChamps();
    this.cdr.detectChanges();
  }

  changerDestination(mode: 'DEMANDE' | 'BENEFICIAIRE'): void {
    this.modeAffectation = mode;

    this.demandeAideId = null;
    this.beneficiaireId = null;

    this.rechercheDemande = '';
    this.rechercheBeneficiaire = '';

    this.listeDemandesOuverte = false;
    this.listeBeneficiairesOuverte = false;

    this.effacerErreursChamps();
    this.cdr.detectChanges();
  }

  changerUnite(valeur: string): void {
    this.unite = valeur;
    this.utiliserUnitePersonnalisee = valeur === 'AUTRE';

    if (valeur !== 'AUTRE') {
      this.unitePersonnalisee = '';
    }

    this.erreurUnite = '';
    this.cdr.detectChanges();
  }

  // Effacement des erreurs lors de la saisie
  onMontantChange(): void {
    this.erreurMontant = '';
    this.cdr.detectChanges();
  }

  onQuantiteChange(): void {
    this.erreurQuantite = '';
    this.cdr.detectChanges();
  }

  onUnitePersonnaliseeChange(): void {
    this.erreurUnite = '';
    this.cdr.detectChanges();
  }

  onRechercheDemandeChange(): void {
    this.demandeAideId = null;
    this.erreurDemande = '';
    this.cdr.detectChanges();
  }

  onRechercheBeneficiaireChange(): void {
    this.beneficiaireId = null;
    this.erreurBeneficiaire = '';
    this.cdr.detectChanges();
  }

  onRechercheDonChange(): void {
    this.donId = null;
    this.erreurDon = '';
    this.cdr.detectChanges();
  }

  private effacerErreursChamps(): void {
    this.erreurMontant = '';
    this.erreurQuantite = '';
    this.erreurUnite = '';
    this.erreurDemande = '';
    this.erreurBeneficiaire = '';
    this.erreurDon = '';
    this.erreur = '';
  }

  // Validation
  validerFormulaire(): boolean {
    this.effacerErreursChamps();

    const don = this.donSelectionne;

    if (!don) {
      this.erreurDon = 'Veuillez sélectionner un don disponible.';
    }

    if (this.modeAffectation === 'DEMANDE') {
      const demande = this.demandeSelectionnee;

      if (
        !demande ||
        demande.statut !== 'VALIDEE' ||
        demande.statutCollecte === 'TERMINEE'
      ) {
        this.erreurDemande =
          'Veuillez sélectionner une demande validée disponible.';
      }
    } else {
      const beneficiaire = this.beneficiaires.find(
        item => Number(item.id) === Number(this.beneficiaireId)
      );

      if (!beneficiaire || beneficiaire.statut !== 'ACCEPTE') {
        this.erreurBeneficiaire =
          'Veuillez sélectionner un bénéficiaire accepté.';
      }
    }

    if (don) {
      if (this.typeAide === 'FINANCIER') {
        if (
          this.montantAffecte === null ||
          !Number.isFinite(this.montantAffecte) ||
          this.montantAffecte <= 0
        ) {
          this.erreurMontant =
            'Veuillez saisir un montant supérieur à zéro.';
        } else if (
          this.montantAffecte > this.getMontantDisponible(don)
        ) {
          this.erreurMontant =
            `Le montant dépasse le montant disponible du don (${this.getMontantDisponible(don).toLocaleString('fr-FR')} FCFA).`;
        } else {
          const restant = this.montantRestantDemandeSelectionnee;

          if (
            this.modeAffectation === 'DEMANDE' &&
            restant !== null &&
            this.montantAffecte > restant
          ) {
            this.erreurMontant =
              `Le montant dépasse le besoin restant (${restant.toLocaleString('fr-FR')} FCFA).`;
          }
        }
      } else {
        if (
          this.quantiteAffectee === null ||
          !Number.isInteger(this.quantiteAffectee) ||
          this.quantiteAffectee <= 0
        ) {
          this.erreurQuantite =
            'Veuillez saisir une quantité entière supérieure à zéro.';
        } else if (
          this.quantiteAffectee > this.getQuantiteDisponible(don)
        ) {
          this.erreurQuantite =
            `La quantité dépasse la quantité disponible (${this.getQuantiteDisponible(don)}).`;
        }

        if (!this.uniteFinale) {
          this.erreurUnite =
            'Veuillez sélectionner ou préciser une unité.';
        }
      }
    }

    this.cdr.detectChanges();

    return !(
      this.erreurMontant ||
      this.erreurQuantite ||
      this.erreurUnite ||
      this.erreurDemande ||
      this.erreurBeneficiaire ||
      this.erreurDon
    );
  }

  // Étape 1 : valider puis afficher la confirmation
  enregistrer(): void {
    if (!this.validerFormulaire()) {
      return;
    }

    if (this.organisationId === null) {
      this.notificationService.erreur(
        'Impossible de récupérer votre organisation.'
      );
      return;
    }

    if (!this.donSelectionne) {
      this.erreurDon = 'Le don sélectionné est introuvable.';
      return;
    }

    this.confirmationOuverte = true;
    this.cdr.detectChanges();
  }

  // Fermer la fenêtre sans enregistrer
  fermerConfirmation(): void {
    if (this.chargement) {
      return;
    }

    this.confirmationOuverte = false;
    this.cdr.detectChanges();
  }

  // Étape 2 : seul ce bouton lance l'enregistrement
  confirmerAffectation(): void {
    if (!this.confirmationOuverte || this.chargement) {
      return;
    }

    // Revalider avant d'envoyer les données
    if (!this.validerFormulaire()) {
      this.confirmationOuverte = false;
      return;
    }

    this.sauvegarderAffectation();
  }

  // Enregistrement réel dans le backend
  private sauvegarderAffectation(): void {
    if (this.organisationId === null) {
      this.notificationService.erreur(
        'Impossible de récupérer votre organisation.'
      );
      return;
    }

    const don = this.donSelectionne;

    if (!don) {
      this.erreurDon = 'Le don sélectionné est introuvable.';
      this.confirmationOuverte = false;
      return;
    }

    this.chargement = true;
    this.cdr.detectChanges();

    if (this.typeAide === 'FINANCIER') {
      const demande: AffectationDonRequest = {
        donFinancierId: don.donId,
        demandeAideId:
          this.modeAffectation === 'DEMANDE'
            ? this.demandeAideId
            : null,
        beneficiaireId:
          this.modeAffectation === 'BENEFICIAIRE'
            ? this.beneficiaireId
            : null,
        montantAffecte: this.montantAffecte!,
        organisationPartenaireId: this.organisationId
      };

      this.affectationService
        .creer(demande, this.organisationId)
        .pipe(
          finalize(() => {
            this.chargement = false;
            this.cdr.detectChanges();
          })
        )
        .subscribe({
          next: () => {
            this.confirmationOuverte = false;

            this.notificationService.succes(
              'Affectation financière enregistrée avec succès.'
            );

            this.router.navigate([
              '/organisation/affectations-dons'
            ]);
          },

          error: (err) => {
            console.error(
              'Erreur d’affectation financière :',
              err
            );

            this.confirmationOuverte = false;

            this.notificationService.erreur(
              err.error?.message ||
              'Erreur lors de l’affectation financière.'
            );

            this.cdr.detectChanges();
          }
        });

      return;
    }

    const demandeMaterielle: AffectationDonMaterielRequest = {
      donMaterielId: don.donId,
      demandeAideId:
        this.modeAffectation === 'DEMANDE'
          ? this.demandeAideId
          : null,
      beneficiaireId:
        this.modeAffectation === 'BENEFICIAIRE'
          ? this.beneficiaireId
          : null,
      quantiteAffectee: this.quantiteAffectee!,
      unite: this.uniteFinale,
      organisationPartenaireId: this.organisationId
    };

    this.affectationMaterielService
      .creer(demandeMaterielle, this.organisationId)
      .pipe(
        finalize(() => {
          this.chargement = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.confirmationOuverte = false;

          this.notificationService.succes(
            'Affectation matérielle enregistrée avec succès.'
          );

          this.router.navigate([
            '/organisation/affectations-dons'
          ]);
        },

        error: (err) => {
          console.error(
            'Erreur d’affectation matérielle :',
            err
          );

          this.confirmationOuverte = false;

          this.notificationService.erreur(
            err.error?.message ||
            'Erreur lors de l’affectation matérielle.'
          );

          this.cdr.detectChanges();
        }
      });
  }

  annuler(): void {
    if (this.chargement) {
      return;
    }

    this.router.navigate(['/organisation/affectations-dons']);
  }
}