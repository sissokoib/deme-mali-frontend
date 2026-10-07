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

    const roleAutorise = route.data['role'];
    const roleUtilisateur = this.authService.getRole();

    if (roleUtilisateur === roleAutorise) {
      return true;
    }

    return this.router.createUrlTree(['/login']);
  }
}