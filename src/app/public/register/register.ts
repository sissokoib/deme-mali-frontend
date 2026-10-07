import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  registerForm: FormGroup;
  selectedRole: string = 'ORGANISATION_PARTENAIRE';

  constructor(private fb: FormBuilder) {
    // Intégration de TOUS les champs des classes Utilisateur et OrganisationPartenaire
    this.registerForm = this.fb.group({
      // -- Champs de la classe mère Utilisateur --
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      telephone: ['', Validators.required],
      motDePasse: ['', [Validators.required, Validators.minLength(6)]],
      
      // -- Champs de la classe fille OrganisationPartenaire --
      nomStructure: ['', Validators.required], // Correspond à 'nom' dans OrganisationPartenaire
      email: ['', [Validators.required, Validators.email]],
      fonction: ['', Validators.required], // Fonction du représentant
      typeOrganisation: ['', Validators.required],
      numeroEnregistrement: ['', Validators.required],
      adresse: ['', Validators.required],
      ville: ['', Validators.required],
      documentJustificatif: [null, Validators.required]
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.registerForm.patchValue({ documentJustificatif: file });
    }
  }

  onSubmit() {
    if (this.registerForm.valid) {
      const formData = new FormData();
      formData.append('role', this.selectedRole);
      
      Object.keys(this.registerForm.value).forEach(key => {
        formData.append(key, this.registerForm.get(key)?.value);
      });

      console.log('Candidature Partenaire prête à envoyer :', this.registerForm.value);
    }
  }
}
