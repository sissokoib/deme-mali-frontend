
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(private snackBar: MatSnackBar) {}

  succes(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 5000,
      panelClass: ['snackbar-success'],
      verticalPosition: 'top',
      horizontalPosition: 'center'
    });
  }

  erreur(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 5000,
      panelClass: ['snackbar-error'],
      verticalPosition: 'top',
      horizontalPosition: 'center'
    });
  }

  info(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 5000,
      panelClass: ['snackbar-info'],
      verticalPosition: 'top',
      horizontalPosition: 'center'
    });
  }
}
