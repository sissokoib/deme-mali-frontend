import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { EtudeTerrainService } from '../../../services/etude-terrain.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-etudes-liste',
  imports: [RouterLink, CommonModule],
  templateUrl: './etudes-liste.html',
  styleUrl: './etudes-liste.css',
})
export class EtudesListe implements OnInit {
  
  etudes: any[] = [];
  
  aPlanifier = 0;
  planifiee = 0;
  terminee = 0;

  constructor(
    private etudeService: EtudeTerrainService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user && user.id) {
        this.etudeService.getEtudes(user.id).subscribe({
          next: (data) => {
            this.etudes = data;
            this.calculerStatistiques();
          },
          error: (err) => console.error(err)
        });
      }
    });
  }

  calculerStatistiques() {
    this.aPlanifier = this.etudes.filter(e => e.status === 'EN_ATTENTE' || e.status === 'En attente').length;
    this.planifiee = this.etudes.filter(e => e.status === 'PLANIFIEE' || e.status === 'Planifie').length;
    this.terminee = this.etudes.filter(e => e.status === 'TERMINEE' || e.status === 'Termine').length;
  }
}