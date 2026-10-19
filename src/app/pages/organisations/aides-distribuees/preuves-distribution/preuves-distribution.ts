
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { PreuveDistribution, TypeMedia } from '../../../../models/preuve-distribution.model';
import { PreuveDistributionService } from '../../../../services/preuve-distribution.service';

@Component({
  selector: 'app-preuves-distribution',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './preuves-distribution.html',
  styleUrl: './preuves-distribution.css'
})
export class PreuvesDistributionComponent implements OnChanges {

  @Input() aideDistribueeId!: number;

  preuves: PreuveDistribution[] = [];
  fichierSelectionne: File | null = null;
  typeMedia: TypeMedia = 'IMAGE';

  chargement = false;
  envoiEnCours = false;
  messageErreur = '';
  messageSucces = '';

  constructor(
    private preuveService: PreuveDistributionService
  ) {}

  // Charger les preuves lorsque l'identifiant de distribution change
  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['aideDistribueeId'] &&
      this.aideDistribueeId
    ) {
      this.chargerPreuves();
    }
  }

  // Récupérer les preuves enregistrées pour cette distribution
  chargerPreuves(): void {
    this.chargement = true;
    this.messageErreur = '';

    this.preuveService.getByDistribution(this.aideDistribueeId)
      .subscribe({
        next: (preuves) => {
          this.preuves = preuves;
          this.chargement = false;
        },
        error: () => {
          this.messageErreur = 'Impossible de charger les preuves.';
          this.chargement = false;
        }
      });
  }

  // Récupérer le fichier choisi dans le formulaire
  selectionnerFichier(event: Event): void {
    const input = event.target as HTMLInputElement;
    const fichier = input.files?.[0] ?? null;

    this.messageErreur = '';
    this.messageSucces = '';

    if (!fichier) {
      this.fichierSelectionne = null;
      return;
    }

    if (fichier.size > 10 * 1024 * 1024) {
      this.messageErreur = 'Le fichier ne doit pas dépasser 10 Mo.';
      this.fichierSelectionne = null;
      input.value = '';
      return;
    }

    this.fichierSelectionne = fichier;

    // Déterminer le type de média selon le fichier sélectionné
    if (fichier.type.startsWith('image/')) {
      this.typeMedia = 'IMAGE';
    } else if (fichier.type.startsWith('video/')) {
      this.typeMedia = 'VIDEO';
    } else {
      this.typeMedia = 'DOCUMENT';
    }
  }

  // Envoyer le fichier sélectionné au backend
  televerser(): void {
    if (!this.fichierSelectionne) {
      this.messageErreur = 'Veuillez sélectionner un fichier.';
      return;
    }

    this.envoiEnCours = true;
    this.messageErreur = '';
    this.messageSucces = '';

    this.preuveService.ajouter(
      this.aideDistribueeId,
      this.fichierSelectionne,
      this.typeMedia
    ).subscribe({
      next: () => {
        this.messageSucces = 'Preuve ajoutée avec succès.';
        this.fichierSelectionne = null;
        this.envoiEnCours = false;

        this.chargerPreuves();
      },
      error: (erreur) => {
        this.messageErreur =
          erreur.error?.message ?? 'Erreur lors du téléversement.';
        this.envoiEnCours = false;
      }
    });
  }

  // Supprimer une preuve après confirmation
  supprimer(preuve: PreuveDistribution): void {
    const confirmation = window.confirm(
      'Voulez-vous vraiment supprimer cette preuve ?'
    );

    if (!confirmation) {
      return;
    }

    this.messageErreur = '';
    this.messageSucces = '';

    this.preuveService.supprimer(preuve.id).subscribe({
      next: () => {
        this.messageSucces = 'Preuve supprimée avec succès.';
        this.chargerPreuves();
      },
      error: () => {
        this.messageErreur = 'Impossible de supprimer cette preuve.';
      }
    });
  }

  // Construire l'adresse complète du fichier pour son affichage
  urlFichier(url: string): string {
    return this.preuveService.getUrlFichier(url);
  }
}
