
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

  // Accéder au formulaire de nouvelle affectation
  ajouterAffectation(): void {
    this.router.navigateByUrl(
      '/organisation/affectations-dons/add-affection-don'
    );
  }
}
