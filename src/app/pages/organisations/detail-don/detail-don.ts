import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs/operators';

import { DonService } from '../../../services/don.service';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification';

@Component({
  selector: 'app-detail-don',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule],
  templateUrl: './detail-don.html',
  styleUrl: './detail-don.css'
})
export class DetailDonComponent implements OnInit {

  don: any = null;
  typeDon: 'MATERIEL' | 'FINANCIER' = 'MATERIEL';

  chargement = true;
  erreur = '';

  // Popup de réception
  popupReception = false;
  choixReception: 'CONFIRMER' | 'REFUSER' | null = null;
  quantiteRecue: number | null = null;
  motifRefus = '';
  traitementEnCours = false;

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private donService: DonService,
    private authService: AuthService,
    private notification: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  // ---------- Initialisation ----------

  ngOnInit(): void {
    const etat: any = this.location.getState();

    if (etat?.don) {
      this.don = etat.don;
      this.typeDon = (etat.type ?? etat.don.type) === 'FINANCIER'
        ? 'FINANCIER'
        : 'MATERIEL';
      this.chargement = false;
      return;
    }

    // Rechargement de la page (F5) : le state est perdu
    const segments = this.route.snapshot.url.map(s => s.path);
    this.typeDon = segments.includes('financier') ? 'FINANCIER' : 'MATERIEL';

    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isInteger(id) || id <= 0) {
      this.erreur = 'Don introuvable.';
      this.chargement = false;
      return;
    }

    this.rechargerDon(id);
  }

  private rechargerDon(id: number): void {
    const utilisateur = this.authService.getCurrentUser();
    const organisationId = Number(utilisateur?.id);

    if (!Number.isInteger(organisationId) || organisationId <= 0) {
      this.erreur = 'Don introuvable.';
      this.chargement = false;
      return;
    }

    if (this.typeDon === 'MATERIEL') {
      this.donService.getDonsMaterielsByOrganisation(organisationId)
        .pipe(finalize(() => {
          this.chargement = false;
          this.cdr.detectChanges();
        }))
        .subscribe({
          next: liste => {
            const d = liste.find(x => x.id === id);

            if (!d) {
              this.erreur = 'Don introuvable.';
              return;
            }

            this.don = {
              id: d.id,
              type: 'MATERIEL',
              date: d.dateDon,
              demandeAideId: d.demandeAideId,
              titreDemandeAide: d.titreDemandeAide,
              statut: d.statutReception,
              motifRefus: (d as any).motifRefus ?? null,
              designation: d.designation,
              quantite: d.quantite,
              quantiteRecue: d.quantiteRecue,
              unite: d.unite,
              anonyme: d.anonyme
            };
          },
          error: () => this.erreur = 'Don introuvable.'
        });
    } else {
      this.donService.getDonFinancierById(id)
        .pipe(finalize(() => {
          this.chargement = false;
          this.cdr.detectChanges();
        }))
        .subscribe({
          next: d => {
            this.don = {
              id: d.id,
              type: 'FINANCIER',
              date: d.dateDon,
              demandeAideId: d.demandeAideId,
              titreDemandeAide: d.titreDemandeAide,
              statut: d.statut,
              montant: d.montant,
              modePaiement: d.modePaiement,
              anonyme: d.anonyme
            };
          },
          error: () => this.erreur = 'Don introuvable.'
        });
    }
  }

  // ---------- Getters ----------

  get estMateriel(): boolean {
    return this.typeDon === 'MATERIEL';
  }

  get statutActuel(): string {
    return this.don?.statut ?? this.don?.statutReception ?? '';
  }

  // Vrai seulement si le don peut encore être réceptionné ou refusé
  get peutConfirmerReception(): boolean {
    return this.estMateriel &&
      (this.statutActuel === 'EN_ATTENTE' ||
       this.statutActuel === 'PARTIELLEMENT_RECU');
  }

  get messageDonNonReceptionnable(): string {
    switch (this.statutActuel) {
      case 'RECU':
        return 'Ce don a été totalement réceptionné.';
      case 'REFUSE':
        return 'Ce don a été refusé. Il ne peut plus être réceptionné.';
      default:
        return '';
    }
  }

  get quantiteRestanteDuDon(): number {
    if (!this.don) return 0;

    return Math.max(
      0,
      Number(this.don.quantite ?? 0) - Number(this.don.quantiteRecue ?? 0)
    );
  }

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

  // ---------- Popup ----------

  // Le bouton est toujours visible pour un don matériel :
  // si le don est déjà reçu ou refusé, la popup affiche un message
  ouvrirReception(): void {
    if (!this.don || !this.estMateriel) return;

    this.quantiteRecue = this.quantiteRestanteDuDon;
    this.motifRefus = '';
    this.erreur = '';
    this.choixReception = null;
    this.popupReception = true;
  }

  choisirAction(action: 'CONFIRMER' | 'REFUSER'): void {
    if (this.traitementEnCours || !this.peutConfirmerReception) return;

    this.choixReception = action;
    this.erreur = '';
  }

  annulerReception(): void {
    if (this.traitementEnCours) return;

    this.popupReception = false;
    this.choixReception = null;
    this.erreur = '';
  }

  // ---------- Réception ----------

  confirmerReception(): void {
    if (!this.don || !this.peutConfirmerReception) {
      this.erreur = 'Ce don ne peut plus être réceptionné.';
      return;
    }

    const quantite = Number(this.quantiteRecue);

    if (!Number.isInteger(quantite) || quantite <= 0) {
      this.erreur = 'Veuillez saisir une quantité entière supérieure à 0.';
      return;
    }

    if (quantite > this.quantiteRestanteDuDon) {
      this.erreur =
        `Vous pouvez réceptionner ${this.quantiteRestanteDuDon} ${this.don.unite || ''} maximum.`;
      return;
    }

    this.traitementEnCours = true;
    this.erreur = '';

    this.donService.confirmerReception(this.don.id, quantite)
      .pipe(finalize(() => {
        this.traitementEnCours = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: maj => {
          this.appliquerMiseAJour(maj);
          this.notification.succes('Réception enregistrée.');
        },
        error: err => {
          this.erreur = this.recupererMessageErreur(
            err,
            'Impossible de confirmer la réception.'
          );
        }
      });
  }

  // ---------- Refus ----------

  refuserDon(): void {
    if (!this.don || !this.peutConfirmerReception) {
      this.erreur = 'Ce don ne peut plus être refusé.';
      return;
    }

    const motif = this.motifRefus.trim();

    if (!motif) {
      this.erreur = 'Veuillez préciser le motif du refus.';
      return;
    }

    this.traitementEnCours = true;
    this.erreur = '';

    this.donService.refuserDon(this.don.id, motif)
      .pipe(finalize(() => {
        this.traitementEnCours = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: maj => {
          this.appliquerMiseAJour(maj);
          this.notification.succes('Don refusé.');
        },
        error: err => {
          this.erreur = this.recupererMessageErreur(
            err,
            'Impossible de refuser le don.'
          );
        }
      });
  }

  retourner(): void {
    this.location.back();
  }

  // ---------- Utilitaires ----------

  // Fusionne la réponse du backend dans le don affiché
  private appliquerMiseAJour(maj: any): void {
    this.don = {
      ...this.don,
      quantiteRecue: maj.quantiteRecue,
      statut: maj.statutReception,
      motifRefus: maj.motifRefus ?? null
    };

    this.popupReception = false;
    this.choixReception = null;
    this.erreur = '';
    this.cdr.detectChanges();
  }

  private recupererMessageErreur(err: any, parDefaut: string): string {
    if (typeof err?.error === 'string' && err.error.trim()) {
      return err.error;
    }

    return err?.error?.message
      || err?.error?.detail
      || err?.error?.error
      || parDefaut;
  }
}