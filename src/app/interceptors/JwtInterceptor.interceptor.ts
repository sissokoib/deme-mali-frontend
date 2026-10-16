
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

    // Ajouter le token à la requête si disponible
    let authReq = req;

    if (token) {
      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    // Envoyer la requête et gérer les erreurs
    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {

        // Si le token est expiré ou invalide
        if (error.status === 401 && token) {
          this.authService.logout();
        }

        return throwError(() => error);
      })
    );
  }
}
