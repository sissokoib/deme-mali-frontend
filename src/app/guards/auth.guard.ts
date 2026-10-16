
import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean | UrlTree {

    if (this.authService.isLoggedIn()) {
      return true;
    }

    return this.router.createUrlTree(['/login']);
  }
}

@Injectable({
  providedIn: 'root'
})
export class GuestGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean | UrlTree {

    // Si l'utilisateur n'est pas connecté,
    // il peut accéder à la page de connexion.
    if (!this.authService.isLoggedIn()) {
      return true;
    }

    // Récupérer le rôle de l'utilisateur connecté.
    const role = this.authService.getRole();

    // Rediriger selon le rôle.
    if (role === 'ORGANISATIONPARTENAIRE') {
      return this.router.createUrlTree(['/organisation/dashboard']);
    }

    if (role === 'ADMIN') {
      return this.router.createUrlTree(['/admin/dashboard']);
    }

  

    // Si le rôle n'est pas reconnu.
    return this.router.createUrlTree(['/login']);
  }
}
