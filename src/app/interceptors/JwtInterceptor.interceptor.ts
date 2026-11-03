
import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';

import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AuthService } from '../services/auth.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService) { }

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {

    // Ne pas ajouter le token aux routes d'authentification
    if (req.url.includes('/auth/')) {
      return next.handle(req);
    }

    // Récupérer l'access token
    const token = this.authService.getAccessToken();

    // Vérifier si le token est expiré ou invalide localement
    if (token && this.authService.isTokenExpired(token)) {
      console.warn(
        '[JwtInterceptor] Jeton JWT expiré ou invalide. Nettoyage de la session.'
      );

      this.authService.clearSession();
      this.authService.logout();

      return throwError(() => new Error('Session expirée. Veuillez vous reconnecter.'));
    }

    const validToken = this.authService.getAccessToken();

    let authReq = req;

    // Ajouter le Bearer token si disponible
    if (validToken) {
      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${validToken}`
        }
      });
    }

    // Envoyer la requête et gérer les erreurs
    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {

        // Uniquement 401 : problème d'authentification
        if (error.status === 401 && validToken) {

          console.warn(
            '[JwtInterceptor] Erreur 401. Session à renouveler.'
          );

          this.authService.logout();
        }

        // Erreur 403 : accès interdit, vérifier les rôles et permissions
        if (error.status === 403) {
          console.warn(
            '[JwtInterceptor] Accès interdit. Vérifier les autorisations.'
          );
        }

        // Erreur 500 : problème interne du backend.
        // Ne pas supprimer le token et ne pas réessayer sans Authorization.
        if (error.status === 500) {
          console.error(
            '[JwtInterceptor] Erreur interne du serveur Spring Boot.',
            error.error
          );
        }

        return throwError(() => error);
      })
    );
  }
}
