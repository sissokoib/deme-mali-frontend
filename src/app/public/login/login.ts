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

    this.authService.login({
      telephone: this.form.value.telephone.trim(),
      motDePasse: this.form.value.motDePasse
    }).subscribe({

      next: (response) => {
        

        console.log('Réponse login :', response);

        const token = this.authService.getAccessToken();


        if (token) {
          const payload = JSON.parse(
            atob(token.split('.')[1])
          );

          console.log('Payload JWT :', payload);
        }

        const role = this.authService.getRole();

        console.log('Rôle :', role);

        if (role === 'ORGANISATIONPARTENAIRE') {
          
          this.router.navigate(['/organisation/dashboard']);
          
        } /*else if (role === 'ADMIN') {

          this.router.navigate(['/admin/dashboard']);

        } */else {

          this.error = 'Rôle utilisateur non reconnu.';
          this.loading = false;

        }
      },

      error: (err) => {


        this.error = 'Téléphone ou mot de passe incorrect.';
        this.loading = false;

      }

    });
  }
}