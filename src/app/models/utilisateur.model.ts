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
  motDePasse: string;
}

export interface RegisterRequest {
    nom: string;
  prenom: string;
  telephone: string;
  motDePasse: string;
}