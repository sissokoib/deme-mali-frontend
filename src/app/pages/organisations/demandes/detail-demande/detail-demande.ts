
import { Component, OnInit,ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Demande } from '../../../../models/demande.model';
import { demandeAideService } from '../../../../services/demande-aide';


@Component({
  selector: 'app-detail-demande',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detail-demande.html',
  styleUrl: './detail-demande.css'
})
export class DetailDemande implements OnInit {
  demande: Demande | null = null;
  chargement = true;
  erreur = '';

  constructor(
    private route: ActivatedRoute,
    private demandeAideService: demandeAideService,
      private cdr: ChangeDetectorRef
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
    });
  }

  chargerDemande(id: number): void {
    this.chargement = true;
    this.erreur = '';
    this.demande = null;

    this.demandeAideService.getDemandeById(id).subscribe({
      next: (data) => {
        this.demande = data;
        this.chargement = false;
        console.log('Demande récupérée :', data);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erreur lors du chargement de la demande :', error);
        this.erreur = 'Impossible de charger cette demande.';
        this.chargement = false;
        this.cdr.detectChanges();
      }
    });
  }
}
