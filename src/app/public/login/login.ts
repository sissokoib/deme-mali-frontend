import { Component } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
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
          this.router.navigate(['/organisation/dashboard']);
        } else if (role === 'ADMIN') {
          this.router.navigate(['/admin/dashboard']);
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