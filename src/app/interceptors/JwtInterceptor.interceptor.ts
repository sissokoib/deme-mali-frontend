
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

    // Si le token stocké est expiré ou invalide, nettoyer la session
    if (token && this.authService.isTokenExpired(token)) {
      console.warn('[JwtInterceptor] Jeton JWT expiré ou invalide détecté. Nettoyage de la session locale.');
      this.authService.clearSession();
    }

    const validToken = this.authService.getAccessToken();
    let authReq = req;

    if (validToken) {
      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${validToken}`
        }
      });
    }

    // Envoyer la requête et gérer les erreurs de rejet du token (401 ou 500 dû à signature JWT invalide)
    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Le backend Spring Boot renvoie 500 quand un Bearer token possède une signature invalide suite à un redémarrage
        if (validToken && (error.status === 401 || error.status === 500)) {
          console.warn(`[JwtInterceptor] Erreur ${error.status} reçue avec le Bearer token. Nettoyage de la session et tentative de secours sans Authorization...`);

          // Supprimer la session invalide pour ne plus polluer les futures requêtes
          this.authService.clearSession();

          // Réessayer la requête sans l'en-tête Authorization
          const fallbackReq = req.clone({
            headers: req.headers.delete('Authorization')
          });

          return next.handle(fallbackReq).pipe(
            catchError((retryErr: HttpErrorResponse) => {
              if (error.status === 401) {
                this.authService.logout();
              }
              return throwError(() => retryErr);
            })
          );
        }

        if (error.status === 401 && validToken) {
          this.authService.logout();
        }

        return throwError(() => error);
      })
    );
  }
}
