
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';

import { ActivatedRoute, Router } from '@angular/router';

import { demandeAideService } from '../../../../services/demande-aide';
import { AuthService } from '../../../../services/auth.service';
import { TypeJustificatif } from '../../../../models/type-justificatif.models';
import { TypeJustificatifService } from '../../../../services/type-justificatif-service';
import { JustificatifService } from '../../../../services/justificatif-service';
import { MatIconModule } from '@angular/material/icon';
import { Demande } from '../../../../models/demande.model';

@Component({
  selector: 'app-edit-demandes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule
  ],
  templateUrl: './edit-demandes.html',
  styleUrl: './edit-demandes.css'
})
export class EditDemandes implements OnInit {

  formulaire!: FormGroup;
  id!: number;
  demande!: Demande;

  beneficiaires: any[] = [];
  categories: any[] = [];
  typesJustificatifs: TypeJustificatif[] = [];

  fichiers: File[] = [];
  justificatifsExistants: any[] = [];
  justificatifsASupprimer: number[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private demandeAideService: demandeAideService,
    private authService: AuthService,
    private typeJustificatifService: TypeJustificatifService,
    private justificatifService: JustificatifService
  ) {}

  ngOnInit(): void {

    this.formulaire = this.fb.group({
      beneficiaireId: [null, Validators.required],
      categorieDemandeId: [null, Validators.required],
      typeDemande: ['', Validators.required],
      titre: ['', Validators.required],
      nombrePersonne: [
        null,
        [Validators.required, Validators.min(1)]
      ],
      descriptionSituation: ['', Validators.required],
      niveauUrgence: ['', Validators.required],
      montantNecessaire: [
        null,
        [Validators.required, Validators.min(1)]
      ],
      motif: [''],
      typeJustificatifId: [null]
    });

    this.id = Number(this.route.snapshot.paramMap.get('id'));

    if (!this.id || Number.isNaN(this.id)) {
      console.error('Identifiant de demande invalide.');
      return;
    }

    this.chargerDemande();
    this.chargerBeneficiaires();
    this.chargerCategories();
    this.chargerTypesJustificatifs();
    this.chargerJustificatifs();
  }

  chargerDemande(): void {

    this.demandeAideService.getDemandeById(this.id).subscribe({

      next: (demande) => {

        this.demande = demande;

        this.formulaire.patchValue({
          beneficiaireId: demande.beneficiaireId,
          categorieDemandeId: demande.categorieDemandeId,
          typeDemande: demande.typeDemande,
          titre: demande.titre,
          nombrePersonne: demande.nombrePersonne,
          descriptionSituation: demande.descriptionSituation,
          niveauUrgence: demande.niveauUrgence,
          montantNecessaire: demande.montantNecessaire,
          motif: demande.motif
        });

      },

      error: (erreur) => {
        console.error(
          'Erreur lors du chargement de la demande :',
          erreur
        );
      }

    });
  }

  chargerBeneficiaires(): void {

    const utilisateur = this.authService.getCurrentUser();

    if (!utilisateur) {
      return;
    }

    this.demandeAideService
      .getBeneficiairesParOrganisation(utilisateur.id)
      .subscribe({

        next: (data) => {
          this.beneficiaires = data;
        },

        error: (erreur) => {
          console.error(
            'Erreur lors du chargement des bénéficiaires :',
            erreur
          );
        }

      });
  }

  chargerCategories(): void {

    this.demandeAideService.getCategories().subscribe({

      next: (data) => {
        this.categories = data;
      },

      error: (erreur) => {
        console.error(
          'Erreur lors du chargement des catégories :',
          erreur
        );
      }

    });
  }

  chargerTypesJustificatifs(): void {

    this.typeJustificatifService.getAll().subscribe({

      next: (types) => {
        this.typesJustificatifs = types;

        console.log(
          'Types de justificatifs reçus :',
          types
        );
      },

      error: (erreur) => {
        console.error(
          'Erreur lors du chargement des types de justificatifs :',
          erreur
        );
      }

    });
  }

  chargerJustificatifs(): void {

    this.justificatifService.getByDemande(this.id).subscribe({

      next: (justificatifs) => {

        this.justificatifsExistants = justificatifs || [];

        if (this.justificatifsExistants.length > 0) {

          const typeId =
            this.justificatifsExistants[0].typeJustificatifId;

          this.formulaire.patchValue({
            typeJustificatifId: Number(typeId)
          });
        }

        console.log(
          'Justificatifs reçus :',
          justificatifs
        );

      },

      error: (erreur) => {
        console.error(
          'Erreur lors du chargement des justificatifs :',
          erreur
        );
      }

    });
  }

  obtenirNomType(typeId: number | string | null): string {

    if (typeId === null || typeId === undefined) {
      return 'Type non renseigné';
    }

    const type = this.typesJustificatifs.find(
      element => Number(element.id) === Number(typeId)
    );

    return type ? type.nom : 'Chargement du type...';
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

  estUneImage(nomFichier: string | null): boolean {

    if (!nomFichier) {
      return false;
    }

    return /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(nomFichier);
  }

  annuler(): void {
    this.router.navigate(['/organisation/demandes-aide']);
  }

  selectionnerFichiers(event: Event): void {

    const input = event.target as HTMLInputElement;

    if (input.files) {
      this.fichiers = Array.from(input.files);
    }
  }

  supprimerFichier(index: number): void {
    this.fichiers.splice(index, 1);
  }

  retirerJustificatif(id: number): void {

    if (!this.justificatifsASupprimer.includes(id)) {
      this.justificatifsASupprimer.push(id);
    }

    this.justificatifsExistants =
      this.justificatifsExistants.filter(
        justificatif => justificatif.id !== id
      );

    console.log(
      'Justificatifs à supprimer :',
      this.justificatifsASupprimer
    );
  }

  modifierDemande(): void {

    if (this.formulaire.invalid) {
      this.formulaire.markAllAsTouched();
      return;
    }

    const utilisateur = this.authService.getCurrentUser();

    if (!utilisateur) {
      alert('Vous devez être connecté pour modifier cette demande.');
      return;
    }

    const typeId = Number(
      this.formulaire.value.typeJustificatifId
    );

    if (this.fichiers.length > 0 && !typeId) {
      alert('Veuillez sélectionner un type de justificatif.');
      return;
    }

    const demandeModifiee = {

      titre: this.formulaire.value.titre,

      descriptionSituation:
        this.formulaire.value.descriptionSituation,

      niveauUrgence:
        this.formulaire.value.niveauUrgence,

      motif: this.formulaire.value.motif,

      nombrePersonne:
        this.formulaire.value.nombrePersonne,

      montantNecessaire:
        this.formulaire.value.montantNecessaire,

      typeDemande:
        this.formulaire.value.typeDemande,

      beneficiaireId:
        this.formulaire.value.beneficiaireId,

      organisationPartenaireId:
        utilisateur.id,

      categorieDemandeId:
        this.formulaire.value.categorieDemandeId

    };

    // 1. Modifier les informations de la demande
    this.demandeAideService.modifierDemande(
      this.id,
      demandeModifiee
    ).subscribe({

      next: () => {

        // 2. Supprimer les anciens justificatifs demandés
        this.supprimerJustificatifs(0, typeId);

      },

      error: (erreur) => {

        console.error(
          'Erreur lors de la modification :',
          erreur
        );

        alert('Impossible de modifier la demande.');

      }

    });
  }

  // Supprimer les justificatifs un par un
  supprimerJustificatifs(
    index: number,
    typeId: number
  ): void {

    // Toutes les suppressions sont terminées
    if (index >= this.justificatifsASupprimer.length) {

      // Ajouter les nouveaux fichiers si nécessaire
      this.ajouterNouveauxJustificatifs(typeId);

      return;
    }

    const justificatifId =
      this.justificatifsASupprimer[index];

    this.justificatifService.supprimer(justificatifId)
      .subscribe({

        next: () => {

          console.log(
            'Justificatif supprimé :',
            justificatifId
          );

          // Passer au justificatif suivant
          this.supprimerJustificatifs(index + 1, typeId);

        },

        error: (erreur) => {

          console.error(
            'Erreur lors de la suppression du justificatif :',
            justificatifId,
            erreur
          );

          alert(
            'La demande a été modifiée, mais un justificatif n’a pas pu être supprimé. Vérifiez le backend.'
          );

        }

      });
  }

  // Ajouter les nouveaux justificatifs
  ajouterNouveauxJustificatifs(typeId: number): void {

    if (this.fichiers.length === 0) {

      alert('La demande et les suppressions ont été enregistrées avec succès.');

      this.router.navigate(['/organisation/demandes-aide']);

      return;
    }

    this.justificatifService.creerJustificatifs(
      this.fichiers,
      typeId,
      this.id
    ).subscribe({

      next: () => {

        alert(
          'La demande a été modifiée et les justificatifs ont été enregistrés avec succès.'
        );

        this.router.navigate(['/organisation/demandes-aide']);

      },

      error: (erreur) => {

        console.error(
          'Erreur lors de l’envoi des justificatifs :',
          erreur
        );

        alert(
          'La demande a été modifiée, mais les nouveaux justificatifs n’ont pas été envoyés.'
        );

      }

    });
  }

}
