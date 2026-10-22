import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { Demande } from '../../../../models/demande.model';
import { demandeAideService } from '../../../../services/demande-aide';
import { JustificatifService } from '../../../../services/justificatif-service';
import { EtudeTerrainService } from '../../../../services/etude-terrain.service';
import { RapportBesoinService } from '../../../../services/rapport-bessoin';
import { RapportTechniqueService } from '../../../../services/rapport-technique';
import { ImageDemandeService} from '../../../../services/image-demande.service';
import { ImageDemande } from '../../../../models/image-demande.model';

@Component({
  selector: 'app-detail-demande',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatIconModule
  ],
  templateUrl: './detail-demande.html',
  styleUrls: ['./detail-demande.css']
})
export class DetailDemande implements OnInit {

  demande?: Demande;
  justificatifs: any[] = [];

  // Image illustrative associée à la demande
  imageDemande: ImageDemande | null = null;
  afficherFormulaireImage = false;
  fichierImageSelectionne: File | null = null;
  apercuImage: string | null = null;
  chargementImage = false;
  uploadEnCours = false;
  suppressionImageEnCours = false;
  erreurImage = '';

  chargement = true;
  erreur = '';

  // Une demande possède zéro ou une étude de terrain.
  etudeTerrain: any = null;
  rapportBesoin: any = null;
  rapportTechnique: any = null;

  chargementRelations = false;
  erreurRelations = '';

  messagesRelations: {
    titre: string;
    message: string;
    ok: boolean;
  }[] = [];

  popupDecision = false;
  decisionChoisie = '';
  motifDecision = '';
  erreurDecision = '';
  traitementEnCours = false;

  constructor(
    private route: ActivatedRoute,
    private demandeAideService: demandeAideService,
    private justificatifService: JustificatifService,
    private etudeTerrainService: EtudeTerrainService,
    private rapportBesoinService: RapportBesoinService,
    private rapportTechniqueService: RapportTechniqueService,
    private imageDemandeService: ImageDemandeService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));

      if (!Number.isInteger(id) || id <= 0) {
        this.erreur = 'Identifiant de demande invalide.';
        this.chargement = false;
        return;
      }

      this.chargement = true;
      this.erreur = '';

      this.chargerDemande(id);
      this.chargerJustificatifs(id);
      this.chargerImageDemande(id);
    });
  }

  // Articles associés à la demande
  get articles(): any[] {
    return this.demande?.articles ?? [];
  }

  // Type de demande
  get estDemandeMaterielle(): boolean {
    return this.demande?.typeDemandeAide === 'MATERIELLE';
  }

  get estDemandeFinanciere(): boolean {
    return this.demande?.typeDemandeAide === 'FINANCIERE';
  }

  // Vérifier si la demande est en attente
  get estEnAttente(): boolean {
    return this.demande?.statut === 'EN_ATTENTE';
  }

  // Coût estimé des articles
  get totalEstimeArticles(): number {
    return this.articles.reduce((total: number, article: any) => {
      const quantite = Number(article.quantiteDemandee ?? 0);
      const prix = Number(article.prixUnitaireEstime ?? 0);
      return total + quantite * prix;
    }, 0);
  }

  // Progression de la collecte financière
  get progressionCollecte(): number {
    const necessaire = Number(this.demande?.montantNecessaire ?? 0);
    const collecte = Number(this.demande?.montantCollecte ?? 0);

    if (necessaire <= 0) {
      return 0;
    }

    return Math.min(100, Math.max(0, (collecte / necessaire) * 100));
  }

  // Montant restant à collecter
  get montantRestant(): number {
    const necessaire = Number(this.demande?.montantNecessaire ?? 0);
    const collecte = Number(this.demande?.montantCollecte ?? 0);

    return Math.max(0, necessaire - collecte);
  }

  // Le backend renvoie "status", et non "statut".
  get etudeTerminee(): boolean {
    const status = String(this.etudeTerrain?.status ?? '')
      .trim()
      .toUpperCase();

    return status === 'TERMINEE' || status === 'TERMINE';
  }

  // Vérifier que le rapport technique contient ses détails
  get rapportTechniqueComplet(): boolean {
    if (!this.rapportTechnique) {
      return false;
    }

    const details =
      this.rapportTechnique.details ??
      this.rapportTechnique.detailsRapportTechnique ??
      this.rapportTechnique.lignes ??
      [];

    const montantFinal = Number(
      this.rapportTechnique.montantFinal ?? 0
    );

    return Array.isArray(details)
      && details.length > 0
      && montantFinal > 0;
  }

  // Tous les éléments obligatoires pour valider
  get relationsCompletes(): boolean {
    return this.etudeTerminee
      && !!this.rapportBesoin
      && !!this.rapportTechnique
      && this.rapportTechniqueComplet;
  }

  get peutValider(): boolean {
    return this.estEnAttente && this.relationsCompletes;
  }

  get peutRejeter(): boolean {
    return this.estEnAttente && this.etudeTerminee;
  }

  // Charger la demande
  chargerDemande(id: number): void {
    this.demandeAideService.getDemandeById(id).subscribe({
      next: (data: Demande) => {
        this.demande = data;
        this.chargement = false;

        this.verifierRelations(id);
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Erreur chargement demande :', err);

        this.erreur =
          err?.error?.message ||
          'Impossible de charger les informations de la demande.';

        this.chargement = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Charger les justificatifs
  chargerJustificatifs(id: number): void {
    this.justificatifService.getByDemande(id).subscribe({
      next: (data: any[]) => {
        this.justificatifs = data ?? [];
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Erreur chargement justificatifs :', err);
        this.justificatifs = [];
        this.cdr.detectChanges();
      }
    });
  }

  // Vérifier l'étude et les deux rapports associés
  verifierRelations(demandeId: number): void {
    this.chargementRelations = true;
    this.erreurRelations = '';
    this.messagesRelations = [];

    this.etudeTerrain = null;
    this.rapportBesoin = null;
    this.rapportTechnique = null;

    // Récupérer une seule étude de terrain.
    this.etudeTerrainService.getByDemande(demandeId).pipe(
      catchError(err => {
        console.error('Erreur chargement étude de terrain :', err);

        this.erreurRelations =
          'Impossible de vérifier l’étude de terrain.';

        return of(null);
      })
    ).subscribe({
      next: (etude: any) => {
        console.log('Étude de terrain reçue :', etude);

        // Aucune étude associée à la demande
        if (!etude) {
          this.messagesRelations.push({
            titre: 'Étude de terrain',
            message: 'Aucune étude de terrain associée à cette demande.',
            ok: false
          });

          this.messagesRelations.push({
            titre: 'Rapport de besoin',
            message: 'Impossible de vérifier le rapport sans étude de terrain.',
            ok: false
          });

          this.messagesRelations.push({
            titre: 'Rapport technique',
            message: 'Impossible de vérifier le rapport technique sans rapport de besoin.',
            ok: false
          });

          this.finVerificationRelations();
          return;
        }

        // Enregistrer l'unique étude reçue
        this.etudeTerrain = etude;

        // Vérifier si l'étude est terminée
        if (!this.etudeTerminee) {
          this.messagesRelations.push({
            titre: 'Étude de terrain',
            message: 'L’étude de terrain doit être terminée avant toute décision.',
            ok: false
          });

          this.messagesRelations.push({
            titre: 'Rapport de besoin',
            message: 'La vérification nécessite une étude de terrain terminée.',
            ok: false
          });

          this.messagesRelations.push({
            titre: 'Rapport technique',
            message: 'La vérification nécessite une étude de terrain terminée.',
            ok: false
          });

          this.finVerificationRelations();
          return;
        }

        this.messagesRelations.push({
          titre: 'Étude de terrain',
          message: 'Une étude de terrain terminée est disponible.',
          ok: true
        });

        // Récupérer le rapport de besoin lié à cette étude
        this.rapportBesoinService
          .getByEtudeTerrain(this.etudeTerrain.id)
          .pipe(
            catchError(err => {
              if (err?.status !== 404) {
                console.error('Erreur rapport de besoin :', err);
              }

              return of(null);
            })
          )
          .subscribe({
            next: (rapport: any) => {
              this.rapportBesoin = rapport;

              if (!rapport) {
                this.messagesRelations.push({
                  titre: 'Rapport de besoin',
                  message: 'Le rapport de besoin est obligatoire avant la validation.',
                  ok: false
                });

                this.messagesRelations.push({
                  titre: 'Rapport technique',
                  message: 'Impossible de vérifier le rapport technique sans rapport de besoin.',
                  ok: false
                });

                this.finVerificationRelations();
                return;
              }

              this.messagesRelations.push({
                titre: 'Rapport de besoin',
                message: 'Le rapport de besoin est disponible.',
                ok: true
              });

              // Récupérer le rapport technique lié au rapport de besoin
              this.rapportTechniqueService
                .getByRapportBesoin(rapport.id)
                .pipe(
                  catchError(err => {
                    if (err?.status !== 404) {
                      console.error('Erreur rapport technique :', err);
                    }

                    return of(null);
                  })
                )
                .subscribe({
                  next: (technique: any) => {
                    this.rapportTechnique = technique;

                    const techniqueOk = this.rapportTechniqueComplet;

                    this.messagesRelations.push({
                      titre: 'Rapport technique',
                      message: !technique
                        ? 'Le rapport technique est obligatoire avant la validation.'
                        : techniqueOk
                          ? 'Le rapport technique contient des détails et un montant final positif.'
                          : 'Le rapport technique doit contenir des détails et un montant final positif.',
                      ok: techniqueOk
                    });

                    this.finVerificationRelations();
                  },
                  error: err => {
                    console.error('Erreur rapport technique :', err);

                    this.messagesRelations.push({
                      titre: 'Rapport technique',
                      message: 'Impossible de vérifier le rapport technique.',
                      ok: false
                    });

                    this.finVerificationRelations();
                  }
                });
            },
            error: err => {
              console.error('Erreur rapport de besoin :', err);

              this.messagesRelations.push({
                titre: 'Rapport de besoin',
                message: 'Impossible de vérifier le rapport de besoin.',
                ok: false
              });

              this.finVerificationRelations();
            }
          });
      },
      error: err => {
        console.error('Erreur vérification relations :', err);

        this.erreurRelations =
          'Une erreur est survenue pendant la vérification.';

        this.finVerificationRelations();
      }
    });
  }

  private finVerificationRelations(): void {
    this.chargementRelations = false;
    this.cdr.detectChanges();
  }

  // ============================
  // Gestion de l'image de demande
  // ============================

  // Charger l'image associée à la demande
  chargerImageDemande(demandeId: number): void {
    this.chargementImage = true;
    this.erreurImage = '';

    this.imageDemandeService.getByDemande(demandeId).subscribe({
      next: (images: ImageDemande[]) => {
        this.imageDemande =
          images && images.length > 0 ? images[0] : null;

        this.chargementImage = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Erreur chargement image :', err);
        this.imageDemande = null;
        this.chargementImage = false;
        this.erreurImage = 'Impossible de charger l’image.';
        this.cdr.detectChanges();
      }
    });
  }

  // Ouvrir le formulaire d'ajout
  ouvrirFormulaireImage(): void {
      console.log('1. Bouton Ajouter une image cliqué');
  console.log('2. Image existante :', this.imageDemande);
    if (this.imageDemande) {
      console.log('Une image existe déjà.');

      return;
    }

    this.erreurImage = '';
    this.afficherFormulaireImage = true;
  }

  // Sélectionner une image et afficher son aperçu
  selectionnerImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const fichier = input.files?.[0];

    this.erreurImage = '';

    if (!fichier) {
      return;
    }

    const typesAutorises = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    if (!typesAutorises.includes(fichier.type)) {
      this.erreurImage = 'Choisissez une image JPG, PNG ou WEBP.';
      input.value = '';
      return;
    }

    if (fichier.size > 100 * 1024 * 1024) {
      this.erreurImage = 'La taille maximale autorisée est de 100 Mo.';
      input.value = '';
      return;
    }

    this.libererApercuImage();

    this.fichierImageSelectionne = fichier;
    this.apercuImage = URL.createObjectURL(fichier);
  }

  // Enregistrer l'image
  ajouterImage(): void {
    const demandeId = this.demande?.id;
    const fichier = this.fichierImageSelectionne;

    if (demandeId == null || !fichier) {
      this.erreurImage = 'Veuillez sélectionner une image.';
      return;
    }

    this.uploadEnCours = true;
    this.erreurImage = '';

    this.imageDemandeService.ajouterImage(demandeId, fichier).subscribe({
      next: (image: ImageDemande) => {
        this.imageDemande = image;
        this.uploadEnCours = false;
        this.annulerAjoutImage();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Erreur ajout image :', err);
        this.uploadEnCours = false;

        this.erreurImage =
          err?.error?.message ||
          'Impossible d’enregistrer l’image.';

        this.cdr.detectChanges();
      }
    });
  }

  // Construire l'URL de l'image enregistrée
  obtenirUrlImage(cheminFichier: string): string {
    return this.imageDemandeService.obtenirUrlImage(cheminFichier);
  }

  // Annuler l'ajout
  annulerAjoutImage(): void {
    this.afficherFormulaireImage = false;
    this.fichierImageSelectionne = null;
    this.libererApercuImage();
  }

  // Libérer l'aperçu temporaire
  private libererApercuImage(): void {
    if (this.apercuImage) {
      URL.revokeObjectURL(this.apercuImage);
      this.apercuImage = null;
    }
  }

  // Supprimer l'image enregistrée
  supprimerImageDemande(): void {
    const imageId = this.imageDemande?.id;

    if (imageId == null || this.suppressionImageEnCours) {
      return;
    }

    if (!confirm('Voulez-vous vraiment supprimer cette image ?')) {
      return;
    }

    this.suppressionImageEnCours = true;
    this.erreurImage = '';

    this.imageDemandeService.supprimerImage(imageId).subscribe({
      next: () => {
        this.imageDemande = null;
        this.suppressionImageEnCours = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Erreur suppression image :', err);
        this.suppressionImageEnCours = false;

        this.erreurImage =
          err?.error?.message ||
          'Impossible de supprimer l’image.';

        this.cdr.detectChanges();
      }
    });
  }

  // Construire l'URL du justificatif
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

  // Vérifier si le justificatif est une image
  estUneImage(chemin: string | null): boolean {
    if (!chemin) {
      return false;
    }

    return /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(chemin);
  }

  // Ouvrir la fenêtre de décision
  ouvrirDecision(): void {
    if (!this.estEnAttente) {
      return;
    }

    this.popupDecision = true;
    this.decisionChoisie = '';
    this.motifDecision = '';
    this.erreurDecision = '';
  }

  // Fermer la fenêtre de décision
  fermerDecision(): void {
    if (this.traitementEnCours) {
      return;
    }

    this.popupDecision = false;
    this.decisionChoisie = '';
    this.motifDecision = '';
    this.erreurDecision = '';
  }

  // Valider ou rejeter la demande
  confirmerDecision(): void {
    const id = this.demande?.id;

    if (!id) {
      this.erreurDecision = 'Identifiant de demande introuvable.';
      return;
    }

    if (!this.decisionChoisie) {
      this.erreurDecision = 'Veuillez choisir une décision.';
      return;
    }

    // Une étude terminée est obligatoire pour toute décision.
    if (!this.etudeTerminee) {
      this.erreurDecision =
        'Une étude de terrain terminée est obligatoire avant toute décision.';
      return;
    }

    // Les deux rapports sont obligatoires pour valider.
    if (
      this.decisionChoisie === 'VALIDEE' &&
      !this.relationsCompletes
    ) {
      this.erreurDecision =
        'Validation impossible : vérifiez le rapport de besoin et le rapport technique.';
      return;
    }

    // Un motif est obligatoire pour rejeter.
    if (
      this.decisionChoisie === 'REJETEE' &&
      !this.motifDecision.trim()
    ) {
      this.erreurDecision = 'Veuillez préciser le motif du rejet.';
      return;
    }

    this.traitementEnCours = true;
    this.erreurDecision = '';

    const requete = this.decisionChoisie === 'VALIDEE'
      ? this.demandeAideService.validerDemande(id)
      : this.demandeAideService.rejeterDemande(
          id,
          this.motifDecision.trim()
        );

    requete.subscribe({
      next: () => {
        this.traitementEnCours = false;
        this.popupDecision = false;

        this.chargerDemande(id);
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Erreur traitement demande :', err);

        this.traitementEnCours = false;

        this.erreurDecision =
          err?.error?.message ||
          err?.error?.detail ||
          err?.error?.error ||
          'Une erreur est survenue pendant le traitement de la demande.';

        this.cdr.detectChanges();
      }
    });
  }
}