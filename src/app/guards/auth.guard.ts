import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) { }

  canActivate(): boolean | UrlTree {
    if (this.authService.isLoggedIn()) {
      // Utilisateur connecté → autoriser l'accès
      return true;
    }
    // Utilisateur non connecté → rediriger vers /login
    return this.router.createUrlTree(['/login']);
  }
}

// Guard pour les pages "invitées" uniquement (ex: /login ne doit pas être accessible si connecté)
@Injectable({ providedIn: 'root' })
export class GuestGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) { }

  canActivate(): boolean | UrlTree {
    if (!this.authService.isLoggedIn()) {
      return true;
    }
    // Déjà connecté → rediriger vers le tableau de bord
    return this.router.createUrlTree(['/todos']);
  }
}