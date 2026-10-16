import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { AttributionDonLibreService } from '../../../services/attribution-don-libre.service';
import { AttributionDonLibre } from '../../../models/attribution-don-libre.model';

@Component({
  selector: 'app-detail-don-attribue',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './detail-don-attribue.html',
  styleUrl: './detail-don-attribue.css'
})
export class DetailDonAttribue implements OnInit {

  don: AttributionDonLibre | null = null;
  chargement = true;
  erreur = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private attributionService: AttributionDonLibreService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = Number(
      this.route.snapshot.paramMap.get('id')
    );

    if (!Number.isInteger(id) || id <= 0) {
      this.erreur = true;
      this.chargement = false;
      this.cdr.detectChanges();
      return;
    }

    this.attributionService.getById(id).subscribe({
      next: (resultat) => {
            console.log('Détails reçus :', resultat);
    console.log('Score de priorité :', resultat.scorePriorite);

        this.don = resultat;
        this.chargement = false;
        

        this.cdr.detectChanges();
      },

      error: (err) => {
        console.error(
          'Erreur de chargement du don :',
          err
        );

        this.erreur = true;
        this.chargement = false;

        this.cdr.detectChanges();
      }
    });
  }

  retour(): void {
    this.router.navigate([
      '/organisation/dons-attribues'
    ]);
  }
}