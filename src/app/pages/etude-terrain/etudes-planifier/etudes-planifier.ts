import { Component, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { EtudeTerrainService } from '../../../services/etude-terrain.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-etudes-planifier',
  standalone: true,
  imports: [RouterLink, CommonModule, ReactiveFormsModule],
  templateUrl: './etudes-planifier.html',
  styleUrl: './etudes-planifier.css',
})
export class EtudesPlanifier implements OnInit {
  planifierForm: FormGroup;
  demandes: any[] = [];
  user: any;

  constructor(
    private fb: FormBuilder,
    private etudeService: EtudeTerrainService,
    private authService: AuthService,
    private router: Router
  ) {
    this.planifierForm = this.fb.group({
      demandeAideId: ['', Validators.required],
      datePlanification: ['', Validators.required],
      heure: ['', Validators.required],
      lieu: ['', Validators.required],
      objectif: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(u => {
      this.user = u;
      const orgId = this.user?.id || 1;
      if (orgId) {
        this.etudeService.getDemandes(orgId).subscribe({
          next: (data) => this.demandes = data,
          error: (err) => console.error("Erreur chargement demandes", err)
        });
      }
    });
  }

  onSubmit() {
    if (this.planifierForm.invalid) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    const formValues = this.planifierForm.value;
    
    // Le backend attend EtudeTerrainRequestDTO
    const dto = {
      datePlanification: formValues.datePlanification,
      lieu: formValues.lieu,
      objectif: formValues.objectif,
      status: 'PLANIFIEE',
      demandeAideId: formValues.demandeAideId,
      organisationPartenaireId: this.user?.id || 1,
      // L'heure necessite un LocalDateTime cote backend, Angular time picker retourne "HH:mm".
      // On bricole une date valide pour eviter l'erreur 500 :
      heure: formValues.datePlanification + 'T' + formValues.heure + ':00'
    };

    this.etudeService.planifierEtude(dto).subscribe({
      next: (res) => {
        alert("Etude planifiee avec succes !");
        this.router.navigate(['/organisation/etudes-terrain']);
      },
      error: (err) => {
        console.error("Erreur lors de la planification", err);
        alert("Une erreur est survenue lors de la planification.");
      }
    });
  }
}