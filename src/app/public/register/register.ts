import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  registerForm: FormGroup;
  selectedRole: 'ORGANISATION' | 'ADMIN' = 'ORGANISATION';
  currentStep: number = 1;
  showPassword = false;
  showConfirmPassword = false;
  loading = false;
  error: string | null = null;
  successMessage: string | null = null;
  selectedFileName: string | null = null;

  constructor(
    private fb: FormBuilder, 
    private http: HttpClient,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      // Champs communs
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      telephone: ['', Validators.required],
      motDePasse: ['', [Validators.required, Validators.minLength(6)]],
      confirmMotDePasse: [''],

      // Champs Organisation
      nomStructure: [''],
      email: ['', [Validators.email]],
      typeOrganisation: [''],
      numeroEnregistrement: [''],
      adresse: [''],
      ville: [''],
      documentJustificatif: [null]
    });
  }

  get f() {
    return this.registerForm.controls;
  }

  selectRole(role: 'ORGANISATION' | 'ADMIN'): void {
    this.selectedRole = role;
    this.currentStep = 1;
    this.error = null;
    this.successMessage = null;
  }

  nextStep(): void {
    this.error = null;
    if (
      !this.f['nomStructure'].value ||
      !this.f['typeOrganisation'].value ||
      !this.f['numeroEnregistrement'].value ||
      !this.f['email'].value ||
      !this.f['ville'].value ||
      !this.f['adresse'].value
    ) {
      this.error = 'Veuillez remplir tous les champs obligatoires de la structure (*).';
      return;
    }

    if (this.f['email'].invalid) {
      this.error = 'Veuillez saisir une adresse email valide.';
      return;
    }

    this.currentStep = 2;
  }

  prevStep(): void {
    this.error = null;
    this.currentStep = 1;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFileName = file.name;
      this.registerForm.patchValue({ documentJustificatif: file });
    }
  }

  onSubmit(): void {
    this.error = null;
    this.successMessage = null;

    if (this.selectedRole === 'ORGANISATION') {
      if (this.currentStep === 1) {
        this.nextStep();
        return;
      }

      // Validation de l'étape 2 (Représentant)
      if (
        !this.f['nom'].value ||
        !this.f['prenom'].value ||
        !this.f['telephone'].value ||
        !this.f['motDePasse'].value
      ) {
        this.error = 'Veuillez remplir tous les champs obligatoires du représentant (*).';
        return;
      }

      if (this.f['motDePasse'].value.length < 6) {
        this.error = 'Le mot de passe doit comporter au moins 6 caractères.';
        return;
      }

      this.loading = true;

      const dataToSend = {
        nom: this.registerForm.value.nom,
        prenom: this.registerForm.value.prenom,
        telephone: this.registerForm.value.telephone,
        motDePasse: this.registerForm.value.motDePasse,
        nomOrganisation: this.registerForm.value.nomStructure,
        typeOrganisation: this.registerForm.value.typeOrganisation,
        nif: this.registerForm.value.numeroEnregistrement,
        adresse: this.registerForm.value.adresse,
        ville: this.registerForm.value.ville,
        email: this.registerForm.value.email,
        telephoneOrganisation: this.registerForm.value.telephone
      };

      const formData = new FormData();
      formData.append('organisation', new Blob([JSON.stringify(dataToSend)], {
        type: 'application/json'
      }));

      const file = this.registerForm.get('documentJustificatif')?.value;
      if (file) {
        formData.append('file', file);
      }

      this.http.post('http://localhost:8080/api/organisations-partenaires', formData)
        .subscribe({
          next: () => {
            this.loading = false;
            this.successMessage = 'Inscription réussie ! Votre compte sera examiné sous peu. Redirection...';
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 2000);
          },
          error: (err) => {
            console.error('Erreur inscription organisation :', err);
            this.loading = false;
            this.error = "Une erreur est survenue lors de l'inscription. Veuillez vérifier les informations et réessayer.";
          }
        });

    } else {
      // Validation des champs obligatoires pour Administration
      if (
        !this.f['nom'].value ||
        !this.f['prenom'].value ||
        !this.f['telephone'].value ||
        !this.f['motDePasse'].value
      ) {
        this.error = 'Veuillez remplir tous les champs obligatoires marqués d\'un astérisque (*).';
        return;
      }

      if (this.f['motDePasse'].value.length < 6) {
        this.error = 'Le mot de passe doit comporter au moins 6 caractères.';
        return;
      }

      if (this.f['confirmMotDePasse'].value && this.f['motDePasse'].value !== this.f['confirmMotDePasse'].value) {
        this.error = 'Les mots de passe ne correspondent pas.';
        return;
      }

      this.loading = true;

      const adminData = {
        nom: this.registerForm.value.nom,
        prenom: this.registerForm.value.prenom,
        telephone: this.registerForm.value.telephone,
        motDePasse: this.registerForm.value.motDePasse
      };

      this.http.post('http://localhost:8080/api/admins', adminData)
        .subscribe({
          next: () => {
            this.loading = false;
            this.successMessage = 'Compte administrateur créé avec succès ! Redirection vers la page de connexion...';
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 2000);
          },
          error: (err) => {
            console.error('Erreur création admin :', err);
            this.loading = false;
            this.error = "Une erreur est survenue lors de la création du compte administrateur.";
          }
        });
    }
  }
}