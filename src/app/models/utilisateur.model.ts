export interface User {
  id: number;
  nom: string;
  prenom: string;
  telephone: string;
  role: 'DONATEUR' | 'BENEFICIAIRE' | 'ADMIN'|'ORGANISATIONPARTENAIRE';
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface LoginRequest {
  telephone: string;
  motDepasse: string;
}

export interface RegisterRequest {
    nom: string;
  prenom: string;
  telephone: string;
  motDepasse: string;
}