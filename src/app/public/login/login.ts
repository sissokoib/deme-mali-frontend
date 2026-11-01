import { Component } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { OrganisationService } from '../../services/organisation';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

  form: FormGroup;
  loading = false;
  error: string | null = null;
  infoMessage: string | null = null;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private organisationService: OrganisationService,
    private router: Router
  ) {
    this.form = this.fb.group({
      telephone: ['', [Validators.required]],
      motDePasse: ['', [
        Validators.required,
        Validators.minLength(8)
      ]]
    });
  }

  motDePasseOublie(): void {
    this.infoMessage = "Pour réinitialiser votre mot de passe, veuillez contacter l'administrateur ou le support Dèmè Mali.";
  }

  get f() {
    return this.form.controls;
  }

  onSubmit(): void {

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = null;

    // Réinitialiser tout résidu de session avant une nouvelle connexion
    this.authService.clearSession();

    this.authService.login({
      telephone: this.form.value.telephone.trim(),
      motDePasse: this.form.value.motDePasse
    }).subscribe({

      next: (response) => {
        const role = this.authService.getRole() || (response.user?.role ? response.user.role.replace('ROLE_', '') : null);

        console.log('Connexion réussie pour :', response.user?.prenom, response.user?.nom, '| Rôle :', role);

        if (role === 'ORGANISATIONPARTENAIRE') {
          // Vérification stricte du statut de validation de l'organisation par l'admin
          const orgId = (response.user as any)?.organisationPartenaireId ??
                        (response.user as any)?.organisationId ??
                        response.user?.id;

          this.organisationService.getOrganisationById(orgId).subscribe({
            next: (org) => {
              const rawStatut = (org.statutValidation || org.statut || (response.user as any)?.statutValidation || '').toUpperCase();
              const isValide = rawStatut === 'VALIDEE' || rawStatut === 'VALIDE';
              const isRejete = rawStatut === 'REJETEE' || rawStatut === 'REFUSEE';

              if (isValide) {
                // Compte validé par l'admin : accès autorisé
                this.router.navigate(['/organisation/dashboard']);
              } else if (isRejete) {
                // Compte refusé par l'admin : accès bloqué
                this.authService.clearSession();
                this.error = "Votre demande d'adhésion a été refusée par Dèmè Mali. Veuillez contacter le support pour plus d'informations.";
                this.loading = false;
              } else {
                // Compte encore en attente de validation : accès bloqué
                this.authService.clearSession();
                this.error = "Votre structure est en cours d'examen par Dèmè Mali.";
                this.loading = false;
              }
            },
            error: (err) => {
              console.warn("Vérification statut organisation :", err);
              const userStatut = ((response.user as any)?.statutValidation || (response.user as any)?.statut || '').toUpperCase();

              if (userStatut === 'REJETEE' || userStatut === 'REFUSEE') {
                this.authService.clearSession();
                this.error = "Votre demande d'adhésion a été refusée par Dèmè Mali.";
                this.loading = false;
              } else if (userStatut === 'EN_ATTENTE' || userStatut === 'ATTENTE') {
                this.authService.clearSession();
                this.error = "Votre structure est en cours d'examen par Dèmè Mali.";
                this.loading = false;
              } else {
                this.router.navigate(['/organisation/dashboard']);
              }
            }
          });
        } else if (role === 'ADMIN') {
          this.router.navigate(['/admin/dashboard']);
        } else if (role === 'BENEFICIAIRE') {
          // Les bénéficiaires utilisent l'application mobile
          this.authService.clearSession();
          this.error = "Cet espace web est réservé aux administrateurs et organisations partenaires. Veuillez vous connecter depuis l'application mobile Dèmè Mali.";
          this.loading = false;
        } else {
          this.error = 'Rôle utilisateur non reconnu.';
          this.loading = false;
        }
      },

      error: (err) => {
        console.error('Erreur de connexion :', err);
        this.error = 'Numéro de téléphone ou mot de passe incorrect.';
        this.loading = false;
      }

    });
  }
}
