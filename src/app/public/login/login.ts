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
  showPassword = false; // Basculer visibilité mot de passe

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      telephone: ['', [Validators.required]],
  motDePasse: ['', [Validators.required, Validators.minLength(8)]]

    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = null;

    this.authService.login(this.form.value).subscribe({
      next: () => {
        // Rediriger vers la page principale après connexion réussie
        this.router.navigate(['/todos']);
      },
      error: (err: Error) => {
        this.error = err.message;
        this.loading = false;
      }
    });
  }

  get f() { return this.form.controls; }
}
