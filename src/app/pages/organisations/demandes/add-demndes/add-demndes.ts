import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { Router } from '@angular/router';

import { demandeAideService } from '../../../../services/demande-aide';
import { AuthService } from '../../../../services/auth.service';
import { TypeJustificatif } from '../../../../models/type-justificatif.models';
import { TypeJustificatifService } from '../../../../services/type-justificatif-service';
import { JustificatifService } from '../../../../services/justificatif-service';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-add-demndes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,MatIcon
  ],
  templateUrl: './add-demndes.html',
  styleUrl: './add-demndes.css'
})
export class AddDemndes implements OnInit {

  formulaire!: FormGroup;

  beneficiaires: any[] = [];

  categories: any[] = [];

  fichiers: File[] = [];

  typesJustificatifs: TypeJustificatif[] = [];

  constructor(
    private fb: FormBuilder,
    private demandeAideService: demandeAideService,
    private authService: AuthService,
    private router: Router,
    private typeJustificatifService: TypeJustificatifService,
    private justificatifService: JustificatifService
  ) {}

  ngOnInit(): void {

    this.formulaire = this.fb.group({

      beneficiaireId: [
        null,
        Validators.required
      ],

      categorieDemandeId: [
        null,
        Validators.required
      ],

      typeDemande: [
        '',
        Validators.required
      ],

      titre: [
        '',
        Validators.required
      ],

      nombrePersonne: [
        null,
        [
          Validators.required,
          Validators.min(1)
        ]
      ],

      descriptionSituation: [
        '',
        Validators.required
      ],

      niveauUrgence: [
        '',
        Validators.required
      ],

      montantNecessaire: [
        null,
        [
          Validators.required,
          Validators.min(1)
        ]
      ],

      typeJustificatifId: [
        null
      ]

    });

    this.chargerBeneficiaires();

    this.chargerCategories();

    this.chargerTypesJustificatifs();
  }

  chargerTypesJustificatifs(): void {

    this.typeJustificatifService
      .getAll()
      .subscribe({

        next: (types) => {

          this.typesJustificatifs = types;

        },

        error: (erreur) => {

          console.error(
            'Erreur lors du chargement des types de justificatifs :',
            erreur
          );

        }

      });
  }

  chargerBeneficiaires(): void {

    const utilisateur =
      this.authService.getCurrentUser();

    if (!utilisateur) {

      console.error(
        'Aucun utilisateur connecté'
      );

      return;
    }

    const organisationId =
      utilisateur.id;

    this.demandeAideService
      .getBeneficiairesParOrganisation(
        organisationId
      )
      .subscribe({

        next: (data) => {

          this.beneficiaires = data;

          console.log(
            'Bénéficiaires :',
            data
          );

        },

        error: (error) => {

          console.error(
            'Erreur lors du chargement des bénéficiaires :',
            error
          );

        }

      });
  }

  chargerCategories(): void {

    this.demandeAideService
      .getCategories()
      .subscribe({

        next: (data) => {

          this.categories = data;

          console.log(
            'Catégories :',
            data
          );

        },

        error: (error) => {

          console.error(
            'Erreur lors du chargement des catégories :',
            error
          );

        }

      });
  }

  creerDemande(): void {
      console.log('BOUTON CREER CLIQUE');

    if (this.formulaire.invalid) {
      
      this.formulaire.markAllAsTouched();
      



    console.log('FORMULAIRE INVALIDE');

      return;
    }

    const utilisateur =
      this.authService.getCurrentUser();

    if (!utilisateur) {

      console.error(
        'Aucun utilisateur connecté'
      );

      return;
    }

    const demande = {

      beneficiaireId:
        this.formulaire.value.beneficiaireId,

      categorieDemandeId:
        this.formulaire.value.categorieDemandeId,

      typeDemande:
        this.formulaire.value.typeDemande,

      titre:
        this.formulaire.value.titre,

      nombrePersonne:
        this.formulaire.value.nombrePersonne,

      descriptionSituation:
        this.formulaire.value.descriptionSituation,

      niveauUrgence:
        this.formulaire.value.niveauUrgence,

      montantNecessaire:
        this.formulaire.value.montantNecessaire,

      organisationPartenaireId:
        utilisateur.id

    };

    console.log(
      'Demande envoyée :',
      demande
    );

    this.demandeAideService
      .creerDemande(demande)
      .subscribe({

        next: (data) => {

          console.log(
            'Demande créée avec succès :',
            data
          );

          const demandeAideId =
            data.id;

          const typeJustificatifId =
            this.formulaire.value.typeJustificatifId;

          if (
            this.fichiers.length > 0 &&
            typeJustificatifId
          ) {

            this.justificatifService
              .creerJustificatifs(
                this.fichiers,
                typeJustificatifId,
                demandeAideId
              )
              .subscribe({

                next: (resultat) => {

                  console.log(
                    'Justificatifs enregistrés :',
                    resultat
                  );

                  this.router.navigate([
                    '/organisation/demandes-aide'
                  ]);

                },

                error: (error) => {

                  console.error(
                    'Erreur lors de l’enregistrement des justificatifs :',
                    error
                  );

                }

              });

          } else {

            this.router.navigate([
              '/organisation/demandes-aide'
            ]);

          }

        },

        error: (error) => {

          console.error(
            'Erreur lors de la création de la demande :',
            error
          );

        }

      });
  }

selectionnerFichiers(event: Event): void {

  const input =
    event.target as HTMLInputElement;

  if (input.files) {

    this.fichiers =
      Array.from(input.files);

  }
}

supprimerFichier(index: number): void {

  this.fichiers.splice(index, 1);

}

  annuler(): void {

    this.router.navigate([
      '/organisation/demandes-aide'
    ]);

  }
}