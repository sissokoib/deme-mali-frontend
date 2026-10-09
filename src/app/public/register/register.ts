import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './register.html',
  styleUrl: '../login/login.css',
})
export class Register {
  registerForm: FormGroup;
  selectedRole: string = 'ORGANISATION_PARTENAIRE';
  showPassword = false;
  currentStep = 1;

  constructor(
    private fb: FormBuilder, 
    private http: HttpClient,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      telephone: ['', Validators.required],
      motDePasse: ['', [Validators.required, Validators.minLength(6)]],
      nomStructure: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      fonction: ['', Validators.required],
      typeOrganisation: ['', Validators.required],
      numeroEnregistrement: ['', Validators.required],
      adresse: ['', Validators.required],
      ville: ['', Validators.required],
      documentJustificatif: [null]
    });
  }

  nextStep() {
    if (this.currentStep < 3) this.currentStep++;
  }

  prevStep() {
    if (this.currentStep > 1) this.currentStep--;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.registerForm.patchValue({ documentJustificatif: file });
    }
  }

  onSubmit() {
    if (this.registerForm.valid) {
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
      
      // 1. On ajoute les données de l'organisation sous forme de Blob (JSON)
      // Cela correspond à @RequestPart("organisation") dans Spring Boot
      formData.append('organisation', new Blob([JSON.stringify(dataToSend)], {
        type: 'application/json'
      }));

      // 2. On ajoute le fichier s'il est présent
      // Cela correspond à @RequestPart("file") dans Spring Boot
      const file = this.registerForm.get('documentJustificatif')?.value;
      if (file) {
        formData.append('file', file);
      }

      console.log('Envoi des donnees au backend (FormData) :', dataToSend);

      this.http.post('http://localhost:8080/api/organisations-partenaires', formData)
        .subscribe({
          next: (response) => {
            alert('Inscription reussie ! Vous pouvez maintenant vous connecter.');
            this.router.navigate(['/login']);
          },
          error: (err) => {
            console.error('Erreur lors de l\'inscription', err);
            alert('Une erreur est survenue lors de l\'inscription.');
          }
        });
    } else {
      alert("Veuillez remplir tous les champs obligatoires.");
    }
  }
}