import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { User } from '../models/utilisateur.model';
import { LoginRequest } from '../models/utilisateur.model';
import { AuthResponse } from '../models/utilisateur.model';


@Injectable({
  providedIn: 'root',
})
export class AuthService {
 private apiUrl = 'http://localhost:8081/api';
  // BehaviorSubject : stocke l'utilisateur actuel et notifie les composants abonnés
  private currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());

  // Observable public pour que les composants puissent s'abonner
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) { }
  // Connexion
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => this.storeAuthData(response)),
        catchError(this.handleError)
      );
  }

  // Renouveler l'access token via le refresh token
  refreshToken(): Observable<{ accessToken: string; expiresIn: number }> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error('Pas de refresh token'));
    }

    return this.http.post<any>(`${this.apiUrl}/refresh`, { refreshToken })
      .pipe(
        tap(response => {
          // Stocker uniquement le nouvel access token
          localStorage.setItem('access_token', response.accessToken);
        }),
        catchError((error) => {
          // Refresh token expiré → déconnexion forcée
          this.logout();
          return throwError(() => error);
        })
      );
  }

  // Déconnexion
  logout(): void {
    // Informer Spring Boot (optionnel avec JWT stateless)
    this.http.post(`${this.apiUrl}/logout`, {}).subscribe();
    // Supprimer tous les tokens du localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('current_user');
    // Réinitialiser l'état de l'utilisateur
    this.currentUserSubject.next(null);
    // Rediriger vers la page de login
    this.router.navigate(['/login']);
  }

  // ===== MÉTHODES UTILITAIRES =====

  // Vérifie si l'utilisateur est connecté
  isLoggedIn(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;
    // Vérifier que le token n'est pas expiré
    return !this.isTokenExpired(token);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Stocker les données après login/register
  private storeAuthData(response: AuthResponse): void {
    localStorage.setItem('access_token',  response.accessToken);
    localStorage.setItem('refresh_token', response.refreshToken);
    localStorage.setItem('current_user',  JSON.stringify(response.user));
    this.currentUserSubject.next(response.user);
  }

private getStoredUser(): User | null {
  const stored = localStorage.getItem('current_user');

  if (!stored || stored === 'undefined' || stored === 'null') {
    return null;
  }

  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error('Utilisateur enregistré invalide :', error);
    localStorage.removeItem('current_user');
    return null;
  }
}
  getRole(): string | null {
  const user = this.getCurrentUser();

  return user?.role ?? null;
}

  // Décoder le token JWT pour lire la date d'expiration (sans vérifier la signature)
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // exp est en secondes (Unix timestamp)
      return payload.exp * 1000 < Date.now();
    } catch {
      return true; // Token malformé → considéré expiré
    }
  }

  private handleError(error: any): Observable<never> {
    const message = error.error?.message || 'Erreur d\'authentification';
    return throwError(() => new Error(message));
  }

  
}
