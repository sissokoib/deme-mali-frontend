import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { EtudeTerrainService } from '../../../services/etude-terrain.service';
import { NotificationService } from '../../../services/notification';
import { EtudeTerrain } from '../../../models/etude-terrain.model';

@Component({
  selector: 'app-modifier-etude-terrain',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './modifier-etude-terrain.html',
  styleUrl: './modifier-etude-terrain.css'
})
export class ModifierEtudeTerrain implements OnInit {

  etude: EtudeTerrain | null = null;

  etudeId = 0;
  chargement = false;
  enregistrement = false;
  erreur = '';

  // Statut de la demande d'aide associée
  demandeValidee = false;

  // Informations de planification
  datePlanification = '';
  heure = '';
  lieu = '';
  objectif = '';

  // Informations de réalisation
  dateRealisation = '';
  observation = '';
  resultat = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private etudeService: EtudeTerrainService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.etudeId = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isInteger(this.etudeId) || this.etudeId <= 0) {
      this.erreur = 'Identifiant de l’étude invalide.';
      this.notificationService.erreur(this.erreur);
      return;
    }

    this.chargerEtude();
  }

  get etudeTerminee(): boolean {
    return this.etude?.status === 'TERMINEE';
  }

  chargerEtude(): void {
    this.chargement = true;
    this.erreur = '';

    this.etudeService.getEtudeById(this.etudeId).subscribe({
      next: (data) => {
        this.etude = data;

        // Préremplir tous les champs
        this.datePlanification = data.datePlanification ?? '';

      this.heure = data.heure
  ? data.heure.substring(11, 16)
  : '';
        this.lieu = data.lieu ?? '';
        this.objectif = data.objectif ?? '';

        this.dateRealisation = data.dateRealisation ?? '';
        this.observation = data.observation ?? '';
        this.resultat = data.resultat ?? '';

        /*
         * Le backend doit inclure statutDemande dans la réponse
         * EtudeTerrainResponseDTO.
         */
        this.demandeValidee =
          (data as EtudeTerrain & { statutDemande?: string })
            .statutDemande === 'VALIDEE';

        this.chargement = false;
        this.cdr.detectChanges();

        if (this.demandeValidee) {
          this.notificationService.erreur(
            'Cette demande est validée. La modification est interdite.'
          );
        }
      },

      error: (err) => {
        this.chargement = false;
        this.erreur = err.error?.message
          || 'Impossible de charger les informations de l’étude.';

        this.notificationService.erreur(this.erreur);
        this.cdr.detectChanges();
      }
    });
  }

  enregistrer(form: NgForm): void {
    if (this.enregistrement || !this.etude) {
      return;
    }

    if (this.demandeValidee) {
      this.notificationService.erreur(
        'Impossible de modifier cette étude : la demande d’aide est déjà validée.'
      );
      return;
    }

    if (form.invalid) {
      form.control.markAllAsTouched();

      this.notificationService.erreur(
        'Veuillez vérifier les champs obligatoires.'
      );
      return;
    }

    this.enregistrement = true;

    const donnees = {
      datePlanification: this.datePlanification || null,
      heure: this.heure || null,
      lieu: this.lieu.trim(),
      objectif: this.objectif.trim(),
      dateRealisation: this.dateRealisation || null,
      observation: this.observation.trim(),
      resultat: this.resultat.trim()
    };

    this.etudeService.modifier(this.etudeId, donnees).subscribe({
      next: (data) => {
        this.etude = data;
        this.enregistrement = false;

        this.notificationService.succes(
          'Les modifications de l’étude ont été enregistrées.'
        );

        this.cdr.detectChanges();

        this.router.navigate([
          '/organisation/etudes-terrain/detail',
          this.etudeId
        ]);
      },

      error: (err) => {
        this.enregistrement = false;

        const message = err.error?.message
          || 'Une erreur est survenue lors de la modification.';

        this.notificationService.erreur(message);
        this.cdr.detectChanges();
      }
    });
  }

  retour(): void {
    this.router.navigate([
      '/organisation/etudes-terrain/detail',
      this.etudeId
    ]);
  }
}