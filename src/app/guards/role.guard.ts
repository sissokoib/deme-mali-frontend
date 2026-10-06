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

  canActivate(
    route: ActivatedRouteSnapshot
  ): boolean | UrlTree {

    // Récupérer le rôle autorisé par la route
    const roleAutorise = route.data['role'];

    // Récupérer le rôle de l'utilisateur connecté
    const roleUtilisateur = this.authService.getRole();

    // Vérifier si le rôle correspond
    if (roleUtilisateur === roleAutorise) {
      return true;
    }

    // Rôle incorrect → accès interdit
    return this.router.createUrlTree(['/404']);
  }
}