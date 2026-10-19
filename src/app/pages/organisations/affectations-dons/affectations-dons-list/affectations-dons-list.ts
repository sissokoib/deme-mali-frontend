
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin } from 'rxjs';

import { AffectationDonService } from '../../../../services/affectation-don';
import {
  AffectationFinanciere,
  AffectationMaterielle
} from '../../../../models/affectation-don.model';

type TypeOnglet = 'FINANCIER' | 'MATERIEL';

@Component({
  selector: 'app-affectations-dons-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule
  ],
  templateUrl: './affectations-dons-list.html',
  styleUrl: './affectations-dons-list.css'
})
export class AffectationsDonsList implements OnInit {

  financieres: AffectationFinanciere[] = [];
  materielles: AffectationMaterielle[] = [];

  chargement = true;
  erreur = false;

  // Onglet affiché
  ongletActif: TypeOnglet = 'FINANCIER';

  // Fenêtre de détails
  detailsOuverts = false;
  typeDetails: TypeOnglet = 'FINANCIER';

  detailFinancier: AffectationFinanciere | null = null;
  detailMateriel: AffectationMaterielle | null = null;

  constructor(
    private service: AffectationDonService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.chargerAffectations();
  }

  // Charger les affectations financières et matérielles
  chargerAffectations(): void {
    this.chargement = true;
    this.erreur = false;

    forkJoin({
      financieres: this.service.getAffectationsFinancieres(),
      materielles: this.service.getAffectationsMaterielles()
    }).subscribe({
      next: (resultat) => {
        this.financieres = resultat.financieres;
        this.materielles = resultat.materielles;

        this.chargement = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(
          'Erreur lors du chargement des affectations :',
          err
        );

        this.erreur = true;
        this.chargement = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Changer d'onglet
  changerOnglet(onglet: TypeOnglet): void {
    this.ongletActif = onglet;
  }

  // Ouvrir les détails d'une affectation financière
  voirDetailsFinanciers(affectation: AffectationFinanciere): void {
    this.detailFinancier = affectation;
    this.detailMateriel = null;
    this.typeDetails = 'FINANCIER';
    this.detailsOuverts = true;
  }

  // Ouvrir les détails d'une affectation matérielle
  voirDetailsMateriels(affectation: AffectationMaterielle): void {
    this.detailMateriel = affectation;
    this.detailFinancier = null;
    this.typeDetails = 'MATERIEL';
    this.detailsOuverts = true;
  }

  // Fermer la fenêtre de détails
  fermerDetails(): void {
    this.detailsOuverts = false;
    this.detailFinancier = null;
    this.detailMateriel = null;
  }

  // Accéder au formulaire de nouvelle affectation
  ajouterAffectation(): void {
    this.router.navigateByUrl(
      '/organisation/affectations-dons/add-affection-don'
    );
  }
}
