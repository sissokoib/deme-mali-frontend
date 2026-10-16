
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { Demande } from '../../../../models/demande.model';

import {EtudeTerrain, RapportBesoin,  RapportTechnique} from '../../../../models/etude.model';

import { demandeAideService } from '../../../../services/demande-aide';
import { EtudeTerrainService } from '../../../../services/etude-terrain.service';
import { RapportBessoin } from '../../../../services/rapport-bessoin';
import { RapportTechniqueService } from '../../../../services/rapport-technique';
import { JustificatifService } from '../../../../services/justificatif-service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-detail-demande',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatIconModule,
    FormsModule
  ],
  templateUrl: './detail-demande.html',
  styleUrl: './detail-demande.css'
})
export class DetailDemande implements OnInit {

  demande?: Demande;
  etudeTerrain?: EtudeTerrain;
  rapportBesoin?: RapportBesoin;
  rapportTechnique?: RapportTechnique;
  popupDecision = false;
  decisionChoisie: string = '';
motifDecision: string = '';


  justificatifs: any[] = [];
  erreurDecision='';

  chargement = true;
  erreur = '';

  constructor(
    private route: ActivatedRoute,
    private demandeAideService: demandeAideService,
    private cdr: ChangeDetectorRef,
    private etudeTerrainService: EtudeTerrainService,
    private rapportBesoinService: RapportBessoin,
    private rapportTechniqueService: RapportTechniqueService,
    private justificatifService: JustificatifService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));

      if (!id || isNaN(id)) {
        this.erreur = 'Identifiant de demande invalide.';
        this.chargement = false;
        return;
      }

      this.chargerDemande(id);
      this.chargerEtudeTerrainParDemande(id);
      this.chargerJustificatifs(id);
    });
  }

  chargerDemande(id: number): void {
    this.demandeAideService.getDemandeById(id).subscribe({
      next: (data: Demande) => {
        this.demande = data;
        console.log('Demande récupérée :', data);
        this.cdr.detectChanges();
      },
      error: (error: unknown) => {
        console.error('Erreur lors du chargement de la demande :', error);
        this.erreur = 'Impossible de charger la demande.';
        this.cdr.detectChanges();
      }
    });
  }

  chargerEtudeTerrainParDemande(id: number): void {
    this.etudeTerrainService.EtudeTerrainParDemande(id).subscribe({
      next: (data: EtudeTerrain[]) => {
        console.log('Études de terrain récupérées :', data);

        if (data && data.length > 0) {
          this.etudeTerrain = data[0];

          if (this.etudeTerrain.id !== undefined) {
            this.chargerRapportBesoin(this.etudeTerrain.id);
          }
        } else {
          this.etudeTerrain = undefined;
          this.rapportBesoin = undefined;
          this.rapportTechnique = undefined;
        }

        this.chargement = false;
        this.cdr.detectChanges();
      },
      error: (error: unknown) => {
        console.error(
          'Erreur lors du chargement de l’étude de terrain :',
          error
        );

        this.etudeTerrain = undefined;
        this.chargement = false;
        this.cdr.detectChanges();
      }
    });
  }

  chargerRapportBesoin(etudeTerrainId: number): void {
    this.rapportBesoinService
      .EtudeTerrainParRapport(etudeTerrainId)
      .subscribe({
        next: (data: RapportBesoin) => {
          this.rapportBesoin = data;

          console.log('Rapport de besoin récupéré :', data);

          if (data.id !== undefined) {
            this.chargerRapportTechnique(data.id);
          }

          this.cdr.detectChanges();
        },
        error: (error: unknown) => {
          console.error(
            'Erreur lors du chargement du rapport de besoin :',
            error
          );

          this.rapportBesoin = undefined;
          this.rapportTechnique = undefined;
          this.cdr.detectChanges();
        }
      });
  }

  chargerRapportTechnique(rapportBesoinId: number): void {
    this.rapportTechniqueService
      .EtudeTerrainParRapport(rapportBesoinId)
      .subscribe({
        next: (data: RapportTechnique) => {
          this.rapportTechnique = data;

          console.log('Rapport technique récupéré :', data);

          this.cdr.detectChanges();
        },
        error: (error: unknown) => {
          console.error(
            'Erreur lors du chargement du rapport technique :',
            error
          );

          this.rapportTechnique = undefined;
          this.cdr.detectChanges();
        }
      });
  }

  chargerJustificatifs(demandeId: number): void {
    this.justificatifService.getByDemande(demandeId).subscribe({
      next: (data) => {
        this.justificatifs = data || [];

        console.log(
          'Justificatifs reçus :',
          JSON.stringify(this.justificatifs, null, 2)
        );

        this.cdr.detectChanges();
      },
      error: (erreur: unknown) => {
        console.error(
          'Erreur lors du chargement des justificatifs :',
          erreur
        );

        this.justificatifs = [];
        this.cdr.detectChanges();
      }
    });
  }

  obtenirUrlJustificatif(chemin: string | null): string {
    if (!chemin) {
      return '';
    }

    const nomFichier = chemin.split(/[\\/]/).pop();

    if (!nomFichier) {
      return '';
    }

    return 'http://localhost:8080/uploads/justificatifs/'
      + encodeURIComponent(nomFichier);
  }

  estUneImage(chemin: string | null): boolean {
    if (!chemin) {
      return false;
    }

    return /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(chemin);
  }
 
  ouvrirDecision(): void {
      console.log('Clic sur Traiter la demande');

  this.popupDecision = true;
}





confirmerDecision(): void {
  this.erreurDecision = '';

  if (this.demande?.id == null) {
    this.erreurDecision = 'Identifiant de demande introuvable.';
    return;
  }

  if (!this.decisionChoisie) {
    this.erreurDecision = 'Veuillez choisir une décision.';
    return;
  }

  if (
    this.decisionChoisie === 'REJETEE' &&
    !this.motifDecision.trim()
  ) {
    this.erreurDecision = 'Veuillez saisir le motif du rejet.';
    return;
  }

  const id = this.demande.id;

  if (this.decisionChoisie === 'VALIDEE') {
    this.demandeAideService.validerDemande(id).subscribe({
      next: () => {
        this.fermerDecision();
        this.chargerDemande(id);
        this.cdr.detectChanges();
      },
      error: (erreur) => {
        console.error('Erreur lors de la validation :', erreur);
        this.erreurDecision = 'Impossible de valider la demande.';
        this.cdr.detectChanges();
      }
    });
  } else if (this.decisionChoisie === 'REJETEE') {
    this.demandeAideService
      .rejeterDemande(id, this.motifDecision.trim())
      .subscribe({
        next: () => {
          this.fermerDecision();
          this.chargerDemande(id);
          this.cdr.detectChanges();
        },
        error: (erreur) => {
          console.error('Erreur lors du rejet :', erreur);
          this.erreurDecision = 'Impossible de rejeter la demande.';
          this.cdr.detectChanges();
        }
      });
  }
}


fermerDecision(): void {
  this.popupDecision = false;
  this.decisionChoisie = '';
  this.motifDecision = '';
  this.erreurDecision = '';
}


}
