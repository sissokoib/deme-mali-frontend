import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { AideDistribueeService } from '../../../services/aides-distribuees';
import { AideDistribueeResponse } from '../../../models/aide-distribuee.model';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-aides-distribuees',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule
  ],
  templateUrl: './aides-distribuees.html',
  styleUrl: './aides-distribuees.css'
})
export class AidesDistribueesComponent implements OnInit {

  private aideService = inject(AideDistribueeService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  aides: AideDistribueeResponse[] = [];

  chargement: boolean = false;
  erreur: string = '';

  ngOnInit(): void {
    this.chargerAides();
  }

  chargerAides(): void {
    this.chargement = true;
    this.erreur = '';

    this.aideService.trouverToutes().subscribe({

      next: (donnees: AideDistribueeResponse[]) => {
        this.aides = donnees;
        this.chargement = false;
              this.cdr.detectChanges();

      },

      error: (erreur) => {
        console.error('Erreur lors du chargement des aides :', erreur);

        this.erreur = 'Impossible de charger les aides distribuées.';
        this.chargement = false;
              this.cdr.detectChanges();

      }

    });
  }

  ouvrirFormulaireAjout(): void {
    this.router.navigate(['/organisation/aides-distribuees/ajouter']);
  }
  voir(id: number): void {
  // Ouvrir la page de détails de l'aide
}

modifier(id: number): void {
  // Ouvrir le formulaire de modification de l'aide
}
}