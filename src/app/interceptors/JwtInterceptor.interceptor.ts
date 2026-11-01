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

    // Si le token stocké est expiré ou invalide, déconnecter proprement
    if (token && this.authService.isTokenExpired(token)) {
      console.warn('[JwtInterceptor] Jeton JWT expiré ou invalide détecté. Redirection vers la page de connexion.');
      this.authService.logout();
      return throwError(() => new Error('Session expirée'));
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

    // Envoyer la requête et intercepter les erreurs d'authentification
    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Le backend Spring Boot renvoie 500 uniquement si la signature JWT est rejetée suite à un redémarrage
        const isJwtSignatureError = error.status === 500 && (
          (typeof error.error === 'string' && (error.error.includes('JWT') || error.error.includes('token') || error.error.includes('SignatureException') || error.error.includes('ExpiredJwtException'))) ||
          (typeof error.error?.message === 'string' && (error.error.message.includes('JWT') || error.error.message.includes('token') || error.error.message.includes('Signature') || error.error.message.includes('expired')))
        );

        // Une erreur HTTP 500 ordinaire (erreur serveur / base de données) ne doit JAMAIS vider la session utilisateur !
        if (validToken && (error.status === 401 || isJwtSignatureError)) {
          console.warn(`[JwtInterceptor] Rejet d'authentification (${error.status}). Redirection vers la page de connexion...`);
          this.authService.logout();
        }

        return throwError(() => error);
      })
    );
  }
}
