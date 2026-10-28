
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {BehaviorSubject,
  Observable,
  tap,
  catchError,
  throwError
} from 'rxjs';
import { Router } from '@angular/router';

import { User, LoginRequest, AuthResponse } from '../models/utilisateur.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://localhost:8080/api/auth';

  private currentUserSubject = new BehaviorSubject<User | null>(
    this.getStoredUser()
  );

  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  // CONNEXION
  login(credentials: LoginRequest): Observable<AuthResponse> {

    return this.http.post<AuthResponse>(
      `${this.apiUrl}/login`,
      credentials
    ).pipe(
      tap(response => {
        this.storeAuthData(response);
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  // NETTOYAGE COMPLET DE LA SESSION
  clearSession(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('current_user');
    this.currentUserSubject.next(null);
  }

  // DECONNEXION LOCALE
  logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  // VERIFIER SI L'UTILISATEUR EST CONNECTE
  isLoggedIn(): boolean {
    const token = this.getAccessToken();

    if (!token) {
      return false;
    }

    if (this.isTokenExpired(token)) {
      this.clearSession();
      return false;
    }

    return true;
  }

  // RECUPERER LE TOKEN
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  // RECUPERER L'UTILISATEUR CONNECTE
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // ENREGISTRER LES DONNEES DE CONNEXION
  private storeAuthData(response: AuthResponse): void {
    if (!response || !response.accessToken || !response.user) {
      return;
    }

    localStorage.setItem(
      'access_token',
      response.accessToken
    );

    localStorage.setItem(
      'current_user',
      JSON.stringify(response.user)
    );

    this.currentUserSubject.next(response.user);
  }

  // RECUPERER L'UTILISATEUR ENREGISTRE
  private getStoredUser(): User | null {

    const stored = localStorage.getItem('current_user');

    if (!stored || stored === 'undefined' || stored === 'null') {
      return null;
    }

    try {
      return JSON.parse(stored);
    } catch {
      localStorage.removeItem('current_user');
      return null;
    }
  }

  // RECUPERER LE ROLE DEPUIS LE TOKEN (OU L'UTILISATEUR CONNECTE)
  getRole(): string | null {

    const token = this.getAccessToken();

    if (!token || this.isTokenExpired(token)) {
      return null;
    }

    try {
      const parts = token.split('.');
      if (parts.length >= 2) {
        const payload = JSON.parse(
          atob(
            parts[1]
              .replace(/-/g, '+')
              .replace(/_/g, '/')
          )
        );

        const role = payload.role;

        if (role && typeof role === 'string') {
          return role.replace('ROLE_', '');
        }
      }
    } catch {
      // Échec de décodage du token, repli sur l'utilisateur en session
    }

    const user = this.getCurrentUser();
    if (user?.role) {
      return user.role.replace('ROLE_', '');
    }

    return null;
  }

  // VERIFIER SI LE TOKEN EST EXPIRE OU INVALIDE
  public isTokenExpired(token: string): boolean {
    if (!token || typeof token !== 'string' || !token.includes('.')) {
      return true;
    }

    try {
      const parts = token.split('.');
      if (parts.length < 2) {
        return true;
      }

      const payload = JSON.parse(
        atob(
          parts[1]
            .replace(/-/g, '+')
            .replace(/_/g, '/')
        )
      );

      if (typeof payload.exp !== 'number') {
        return true;
      }

      return payload.exp * 1000 <= Date.now();

    } catch {
      return true;
    }
  }

  // VERIFIER SI L'UTILISATEUR EST L'ADMINISTRATEUR PAR DEFAUT DU BACKEND (SUPER-ADMIN)
  isSuperAdmin(): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    if (user.role !== 'ADMIN') return false;

    const tel = (user.telephone || '').replace(/\D/g, '');
    // Initialisé dans InsererAdmin.java (Ibrahim Coulibaly / 77990488 / id=1)
    return tel.endsWith('77990488') || user.id === 1 || (user.nom === 'Coulibaly' && user.prenom === 'Ibrahim');
  }
}

