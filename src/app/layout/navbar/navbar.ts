import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    AsyncPipe
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar {

  private readonly authService = inject(AuthService);

  readonly currentUser$ = this.authService.currentUser$;

  currentDate = new Date();

  obtenirDate(): string {

    const jour = this.currentDate.getDate();
    const mois = this.currentDate.getMonth() + 1;
    const annee = this.currentDate.getFullYear();

    return `${jour.toString().padStart(2, '0')}/${mois.toString().padStart(2, '0')}/${annee}`;
  }

  obtenirInitiales(prenom: string, nom: string): string {

    const initialePrenom = prenom?.trim().charAt(0) ?? '';
    const initialeNom = nom?.trim().charAt(0) ?? '';

    return `${initialePrenom}${initialeNom}`.toUpperCase();
  }
}