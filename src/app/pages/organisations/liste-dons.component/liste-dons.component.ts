
import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  forkJoin,
  catchError,
  finalize,
  of
} from 'rxjs';

import { MatIconModule } from '@angular/material/icon';
import {
  MatDialog,
  MatDialogModule
} from '@angular/material/dialog';

import { Router } from '@angular/router';

import { DonService } from '../../../services/don.service.ts';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification';

import {
  DonFinancier,
  DonAffiche,
  DonMateriel
} from '../../../models/don.model';

import { ReceptionDonDialogComponent } from '../../../dialogs/reception-don-dialog.component/reception-don-dialog.component';

@Component({
  selector: 'app-liste-dons',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatDialogModule
  ],
  templateUrl: './liste-dons.component.html',
  styleUrl: './liste-dons.component.css'
})
export class ListeDonsComponent implements OnInit {

  // Listes des dons
  donsFinanciers: DonFinancier[] = [];
  donsMateriels: DonMateriel[] = [];
  dons: DonAffiche[] = [];

  // Recherche et filtres
  ongletActif: 'FINANCIER' | 'MATERIEL' = 'FINANCIER';
  recherche = '';
  filtreStatut = 'TOUS';

  // Chargement
  chargement = false;
  erreurChargement = false;

  // Statistiques
  nombreDonsFinanciers = 0;
  nombreDonsMateriels = 0;
  nombreEnAttente = 0;
  totalDons = 0;

  montantTotalDonsFinanciers = 0;
  quantiteMaterielleAttribuee = 0;

  // Organisation connectée
  organisationId: number | null = null;

  // Pagination
  pageActuelle = 1;
  taillePage = 10;

  constructor(
    private donService: DonService,
    private authService: AuthService,
    private notification: NotificationService,
    private dialog: MatDialog,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  // Initialisation
  ngOnInit(): void {
    this.chargerOrganisation();
  }

  // Récupérer l'organisation connectée
  chargerOrganisation(): void {
    const utilisateur = this.authService.getCurrentUser();

    if (!utilisateur) {
      return;
    }

    const id = Number(utilisateur.id);

    if (!Number.isInteger(id) || id <= 0) {
      return;
    }

    this.organisationId = id;
    this.chargerDons();
  }

  // Charger les dons financiers et matériels
  chargerDons(): void {
    if (this.organisationId === null) {
      return;
    }

    this.chargement = true;
    this.erreurChargement = false;

    forkJoin({
      financiers: this.donService
        .getDonsFinanciers(this.organisationId)
        .pipe(
          catchError(() => {
            this.erreurChargement = true;
            return of([] as DonFinancier[]);
          })
        ),

      materiels: this.donService
        .getDonsMateriels(this.organisationId)
        .pipe(
          catchError(() => {
            this.erreurChargement = true;
            return of([] as DonMateriel[]);
          })
        )
    })
      .pipe(
        finalize(() => {
          this.chargement = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe(resultat => {
        this.donsFinanciers = resultat.financiers;
        this.donsMateriels = resultat.materiels;

        this.assemblerDons();
        this.calculerStatistiques();

        this.cdr.detectChanges();
      });
  }

  // Regrouper les dons financiers et matériels
  assemblerDons(): void {
    const financiers: DonAffiche[] =
      this.donsFinanciers.map(don => ({
        id: don.id,
        type: 'FINANCIER',
        date: don.dateDon,
        demandeAideId: don.demandeAideId,
        titreDemandeAide: don.titreDemandeAide,
        statut: don.statut,
        montant: don.montant,
        modePaiement: don.modePaiement,
        anonyme: don.anonyme
      }));

    const materiels: DonAffiche[] =
      this.donsMateriels.map(don => ({
        id: don.id,
        type: 'MATERIEL',
        date: don.dateDon,
        demandeAideId: don.demandeAideId,
        titreDemandeAide: don.titreDemandeAide,
        statut: don.statutReception,
        designation: don.designation,
        quantite: don.quantite,
        quantiteRecue: don.quantiteRecue,
        unite: don.unite,
        anonyme: don.anonyme
      }));

    this.dons = [...financiers, ...materiels].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;

      return dateB - dateA;
    });

    this.pageActuelle = 1;
  }

  // Calculer les statistiques
  calculerStatistiques(): void {
    this.totalDons = this.dons.length;

    this.nombreDonsFinanciers = this.donsFinanciers.length;
    this.nombreDonsMateriels = this.donsMateriels.length;

    this.nombreEnAttente = this.donsMateriels.filter(
      don => don.statutReception === 'EN_ATTENTE'
    ).length;

    this.montantTotalDonsFinanciers =
      this.donsFinanciers.reduce(
        (total, don) => total + Number(don.montant || 0),
        0
      );

    this.quantiteMaterielleAttribuee =
      this.donsMateriels.reduce(
        (total, don) => total + Number(don.quantiteRecue || 0),
        0
      );
  }

  // Changer d'onglet
  changerOnglet(onglet: 'FINANCIER' | 'MATERIEL'): void {
    this.ongletActif = onglet;
    this.recherche = '';
    this.filtreStatut = 'TOUS';
    this.pageActuelle = 1;
  }

  // Rechercher et filtrer les dons
  get donsFiltres(): DonAffiche[] {
    const texte = this.recherche.toLowerCase().trim();

    return this.dons
      .filter(don => don.type === this.ongletActif)
      .filter(don => {
        const correspondRecherche =
          String(don.id).includes(texte) ||
          String(don.demandeAideId ?? '').includes(texte) ||
          (don.titreDemandeAide ?? '').toLowerCase().includes(texte) ||
          (don.designation ?? '').toLowerCase().includes(texte) ||
          (don.modePaiement ?? '').toLowerCase().includes(texte);

        const correspondStatut =
          this.filtreStatut === 'TOUS' ||
          don.statut === this.filtreStatut;

        return correspondRecherche && correspondStatut;
      });
  }

  // Nombre total de pages
  get totalPages(): number {
    return Math.ceil(this.donsFiltres.length / this.taillePage);
  }

  // Dons affichés sur la page actuelle
  get donsPagines(): DonAffiche[] {
    const debut = (this.pageActuelle - 1) * this.taillePage;

    return this.donsFiltres.slice(
      debut,
      debut + this.taillePage
    );
  }

  // Numéros des pages
  get pages(): number[] {
    return Array.from(
      { length: this.totalPages },
      (_, index) => index + 1
    );
  }

  // Changer de page
  changerPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.pageActuelle = page;
    }
  }

  // Revenir à la première page après une recherche ou un filtre
  reinitialiserPagination(): void {
    this.pageActuelle = 1;
  }

  // Ouvrir les détails d'un don
  ouvrirDetailDon(
    don: DonAffiche,
    type: 'FINANCIER' | 'MATERIEL'
  ): void {
    const chemin = type === 'MATERIEL'
      ? '/organisation/dons-reçus/materiel'
      : '/organisation/dons-reçus/financier';

    this.router.navigate([chemin, don.id], {
      state: { don, type }
    });
  }

  // Ouvrir la fenêtre de réception d'un don matériel
  ouvrirReception(don: DonAffiche): void {
    if (
      don.type !== 'MATERIEL' ||
      (
        don.statut !== 'EN_ATTENTE' &&
        don.statut !== 'PARTIELLEMENT_RECU'
      )
    ) {
      return;
    }

    const fenetre = this.dialog.open(
      ReceptionDonDialogComponent,
      {
        width: '450px',
        maxWidth: '95vw',
        disableClose: true,
        data: {
          id: don.id,
          designation: don.designation,
          quantite: don.quantite,
          quantiteRecue: don.quantiteRecue,
          unite: don.unite
        }
      }
    );

    fenetre.afterClosed().subscribe(resultat => {
      if (
        resultat === undefined ||
        resultat === null ||
        resultat === ''
      ) {
        return;
      }

      const quantite = Number(resultat);

      const restante =
        Number(don.quantite) -
        Number(don.quantiteRecue || 0);

      if (
        !Number.isFinite(quantite) ||
        quantite <= 0 ||
        quantite > restante
      ) {
        this.notification.erreur(
          'Vérifie la quantité à réceptionner.'
        );
        return;
      }

      this.donService
        .confirmerReception(don.id, quantite)
        .subscribe({
          next: () => {
            this.notification.succes(
              'Réception enregistrée.'
            );
            this.chargerDons();
          },
          error: () => {
            this.notification.erreur(
              'Impossible de confirmer la réception.'
            );
          }
        });
    });
  }

  // Afficher un statut lisible
  afficherStatut(statut: string): string {
    const statuts: { [key: string]: string } = {
      EN_ATTENTE: 'En attente',
      PARTIELLEMENT_RECU: 'Partiellement reçu',
      RECU: 'Reçu',
      REFUSE: 'Refusé',
    
      CONFIRME: 'Confirmé',
      ECHOUE: 'Échoué'
    };

    return statuts[statut] || statut;
  }
}
