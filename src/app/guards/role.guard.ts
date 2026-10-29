
import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  UrlTree
} from '@angular/router';

import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {

    // Vérifier si l'utilisateur est connecté.
    if (!this.authService.isLoggedIn()) {
      return this.router.createUrlTree(['/login']);
    }

    // Récupérer le rôle autorisé pour la route.
    const roleAutorise = route.data['role'];

    // Récupérer le rôle de l'utilisateur connecté.
    const roleUtilisateur = this.authService.getRole();

    // Vérifier si le rôle correspond.
    if (roleUtilisateur === roleAutorise) {
      return true;
    }

    // Si le rôle ne correspond pas, rediriger vers son espace dédié
    if (roleUtilisateur === 'ORGANISATIONPARTENAIRE') {
      return this.router.createUrlTree(['/organisation/dashboard']);
    }

    if (roleUtilisateur === 'ADMIN') {
      return this.router.createUrlTree(['/admin/dashboard']);
    }

    return this.router.createUrlTree(['/login']);
  }
}
