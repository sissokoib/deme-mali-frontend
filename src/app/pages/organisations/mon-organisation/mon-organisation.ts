
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OrganisationService } from '../../../services/organisation';
import { AuthService } from '../../../services/auth.service';
import { Organisation } from '../../../models/organisation.model';
import { User } from '../../../models/utilisateur.model';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';

@Component({
  selector: 'app-mon-organisation',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './mon-organisation.html',
  styleUrl: './mon-organisation.css'
})
export class MonOrganisation implements OnInit {

  organisation: Organisation | null = null;
  chargement = true;
  erreur = '';

  constructor(
    private organisationService: OrganisationService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.chargerOrganisation();
  }

  chargerOrganisation(): void {

    const utilisateur: User | null =
      this.authService.getCurrentUser();

    if (!utilisateur) {
      this.erreur = 'Aucun utilisateur connecté.';
      this.chargement = false;
      this.cdr.detectChanges();
      return;
    }

    const organisationId = utilisateur.id;

    this.organisationService
      .getOrganisationById(organisationId)
      .subscribe({
        next: (data: Organisation) => {
          this.organisation = data;
          this.chargement = false;
          this.cdr.detectChanges();
        },
        error: (error: unknown) => {
          console.error(
            'Erreur de chargement de l’organisation :',
            error
          );

          this.erreur =
            'Impossible de charger les informations de l’organisation.';

          this.chargement = false;
          this.cdr.detectChanges();
        }
      });
  }

  modifierOrganisation(id: number): void {
    console.log('ID organisation :', id);

    this.router.navigate(['/organisation/modifier', id])
      .then(reussi => {
        console.log('Navigation réussie :', reussi);
        console.log('URL actuelle :', this.router.url);
      })
      .catch(erreur => {
        console.error('Erreur de navigation :', erreur);
      });
  }
}