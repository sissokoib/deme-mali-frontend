import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { User } from '../models/utilisateur.model';
import { LoginRequest, AuthResponse } from '../models/utilisateur.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private apiUrl = 'http://localhost:8081/api/auth';

  private currentUserSubject = new BehaviorSubject<User | null>(
    this.getStoredUser()
  );

  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

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

  refreshToken(): Observable<{ accessToken: string; expiresIn: number }> {

    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error('Pas de refresh token'));
    }

    return this.http.post<any>(
      `${this.apiUrl}/refresh`,
      { refreshToken }
    ).pipe(

      tap(response => {
        localStorage.setItem(
          'access_token',
          response.accessToken
        );
      }),

      catchError(error => {
        this.logout();
        return throwError(() => error);
      })
    );
  }

  logout(): void {

    this.http.post(
      `${this.apiUrl}/logout`,
      {}
    ).subscribe();

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('current_user');

    this.currentUserSubject.next(null);

    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {

    const token = this.getAccessToken();

    if (!token) {
      return false;
    }

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

  private storeAuthData(response: AuthResponse): void {

    localStorage.setItem(
      'access_token',
      response.accessToken
    );

    localStorage.setItem(
      'refresh_token',
      response.refreshToken
    );
  }

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

  getRole(): string | null {

    const token = this.getAccessToken();

    if (!token) {
      return null;
    }

    try {

      const payload = JSON.parse(
        atob(token.split('.')[1])
      );

      const role = payload.role;

      if (!role) {
        return null;
      }

      return role.replace('ROLE_', '');

    } catch {
      return null;
    }
  }

  private isTokenExpired(token: string): boolean {

    try {

      const payload = JSON.parse(
        atob(token.split('.')[1])
      );

      return payload.exp * 1000 < Date.now();

    } catch {
      return true;
    }
  }
}