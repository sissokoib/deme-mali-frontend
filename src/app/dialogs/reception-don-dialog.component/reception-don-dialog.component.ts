import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
  
} from '@angular/material/dialog';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';


@Component({
  selector: 'app-reception-don-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
      MatDividerModule
  ],
  templateUrl: './reception-don-dialog.component.html'
})
export class ReceptionDonDialogComponent {

  formulaire;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ReceptionDonDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      id?: number;
      designation?: string;
      quantite: number;
      quantiteRecue?: number;
      unite?: string;
    }
  ) {
    this.formulaire = this.fb.group({
      quantiteRecue: [
        data.quantiteRecue ?? data.quantite,
        [
          Validators.required,
          Validators.min(1),
          Validators.max(data.quantite)
        ]
      ],
      motifRefus: [
        '',
        [
          Validators.required,
          Validators.minLength(3)
        ]
      ]
    });
  }

  confirmer(): void {
    const controle = this.formulaire.controls.quantiteRecue;

    controle.markAsTouched();

    if (controle.invalid) {
      return;
    }

    this.dialogRef.close({
      action: 'RECEPTION',
      quantiteRecue: Number(controle.value)
    });
  }

  refuser(): void {
    const controle = this.formulaire.controls.motifRefus;

    controle.markAsTouched();

    if (controle.invalid) {
      return;
    }

    const motif = controle.value?.trim();

    if (!motif) {
      controle.setErrors({ required: true });
      return;
    }

    this.dialogRef.close({
      action: 'REFUS',
      motifRefus: motif
    });
  }

  annuler(): void {
    this.dialogRef.close();
  }
}