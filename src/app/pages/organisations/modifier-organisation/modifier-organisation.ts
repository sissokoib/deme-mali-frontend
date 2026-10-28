
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { Organisation } from '../../../models/organisation.model';
import { OrganisationService } from '../../../services/organisation';

@Component({
  selector: 'app-modifier-organisation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modifier-organisation.html',
  styleUrl: './modifier-organisation.css'
})
export class ModifierOrganisation implements OnInit {

  organisation: Organisation = {
    id: 0,
    nom: '',
    prenom: '',
    nomOrganisation: '',
    typeOrganisation: 'ONG',
    nif: '',
    email: '',
    telephone: '',
    telephoneOrganisation: '',
    adresse: '',
    ville: '',
    dateCreation: '',
    statut: '',
    description: ''
  };

  chargement = true;
  enregistrement = false;

  erreur = '';
  messageSucces = '';

  erreurEmail = '';
  erreurTelephone = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private organisationService: OrganisationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id || isNaN(id)) {
      this.erreur = 'Identifiant de l’organisation invalide.';
      this.chargement = false;
      return;
    }

    this.chargerOrganisation(id);
  }

  chargerOrganisation(id: number): void {
    this.chargement = true;

    this.organisationService.getOrganisationById(id).subscribe({
      next: (data: Organisation) => {
        this.organisation = { ...data };
        this.chargement = false;
        this.cdr.detectChanges();
      },

      error: (error) => {
        console.error('Erreur de chargement :', error);

        this.erreur =
          'Impossible de charger les informations de l’organisation.';

        this.chargement = false;
        this.cdr.detectChanges();
      }
    });
  }

  verifierEmail(): void {
    this.erreurEmail = '';
    this.erreur = '';
    this.messageSucces = '';
  }

  verifierTelephone(): void {
    this.erreurTelephone = '';
    this.erreur = '';
    this.messageSucces = '';
  }

  enregistrer(): void {
    this.erreur = '';
    this.erreurEmail = '';
    this.erreurTelephone = '';
    this.messageSucces = '';

    if (!this.organisation.nom?.trim()) {
      this.erreur = 'Le nom est obligatoire.';
      return;
    }

    if (!this.organisation.prenom?.trim()) {
      this.erreur = 'Le prénom est obligatoire.';
      return;
    }

    if (!this.organisation.telephone?.trim()) {
      this.erreurTelephone =
        'Le téléphone de connexion est obligatoire.';
      return;
    }

    if (!this.organisation.email?.trim()) {
      this.erreurEmail = 'L’email est obligatoire.';
      return;
    }

    const emailValide =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        this.organisation.email.trim()
      );

    if (!emailValide) {
      this.erreurEmail =
        'Veuillez saisir une adresse email valide.';
      return;
    }

    if (!this.organisation.nomOrganisation?.trim()) {
      this.erreur = 'Le nom de l’organisation est obligatoire.';
      return;
    }

    if (!this.organisation.ville?.trim()) {
      this.erreur = 'La ville est obligatoire.';
      return;
    }

    if (!this.organisation.adresse?.trim()) {
      this.erreur = 'L’adresse est obligatoire.';
      return;
    }

    if (this.enregistrement) {
      return;
    }

    this.enregistrement = true;

    this.organisationService.modifierOrganisation(
      this.organisation.id,
      this.organisation
    ).subscribe({
      next: (data: Organisation) => {
        this.organisation = data;
        this.enregistrement = false;
        this.messageSucces =
          'Les modifications ont été enregistrées.';

        this.cdr.detectChanges();

        this.router.navigate([
          '/organisation/mon-organisation'
        ]);
      },

      error: (error) => {
        this.enregistrement = false;

        console.error('Erreur de modification :', error);
        console.log('Réponse du backend :', error.error);

        const message = this.extraireMessage(error);
        const texte = message.toLowerCase();

        if (
          texte.includes('téléphone') ||
          texte.includes('telephone') ||
          texte.includes('numéro') ||
          texte.includes('phone')
        ) {
          this.erreurTelephone =
            message || 'Ce numéro de téléphone est déjà utilisé.';
          this.erreur = '';
        } else if (texte.includes('email')) {
          this.erreurEmail =
            message || 'Cette adresse email est déjà utilisée.';
          this.erreur = '';
        } else if (error.status === 400 && message) {
          this.erreur = message;
        } else {
          this.erreur =
            message ||
            'Une erreur est survenue lors de la modification.';
        }

        this.cdr.detectChanges();
      }
    });
  }

  private extraireMessage(error: any): string {
    const corps = error?.error;

    if (typeof corps === 'string' && corps.trim()) {
      return corps.trim();
    }

    if (corps && typeof corps === 'object') {
      const message =
        corps.message ||
        corps.detail ||
        corps.title ||
        corps.error_description;

      if (message) {
        return String(message);
      }
    }

    return '';
  }

  annuler(): void {
    this.router.navigate([
      '/organisation/mon-organisation'
    ]);
  }
}
