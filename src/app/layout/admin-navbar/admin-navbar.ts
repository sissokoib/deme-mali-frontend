import { Component, OnInit, inject } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-navbar',
  standalone: true,
  imports: [
    AsyncPipe,
    CommonModule,
    RouterLink
  ],
  templateUrl: './admin-navbar.html',
  styleUrl: './admin-navbar.css'
})
export class AdminNavbar implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly currentUser$ = this.authService.currentUser$;

  currentDate = new Date();

  ngOnInit(): void {
    const role = this.authService.getRole();
    if (role && role !== 'ADMIN') {
      console.warn('[AdminNavbar] Utilisateur non-administrateur détecté dans l\'espace admin. Redirection...');
      if (role === 'ORGANISATIONPARTENAIRE') {
        this.router.navigate(['/organisation/dashboard']);
      } else {
        this.authService.logout();
      }
    }
  }

  obtenirDate(): string {
    const jour = this.currentDate.getDate();
    const mois = this.currentDate.getMonth() + 1;
    const annee = this.currentDate.getFullYear();

    return `${jour.toString().padStart(2, '0')}/${mois.toString().padStart(2, '0')}/${annee}`;
  }

  obtenirInitiales(prenom?: string, nom?: string): string {
    const initialePrenom = prenom?.trim().charAt(0) ?? '';
    const initialeNom = nom?.trim().charAt(0) ?? '';
    const initiales = `${initialePrenom}${initialeNom}`.toUpperCase();

    return initiales || 'AD';
  }

  obtenirLibelleRole(role?: string): string {
    if (!role) return 'Administrateur';
    if (role === 'ADMIN') return 'Administrateur Plateforme';
    if (role === 'ORGANISATIONPARTENAIRE') return 'Organisation Partenaire';
    if (role === 'DONATEUR') return 'Donateur';
    if (role === 'BENEFICIARE') return 'Bénéficiaire';
    return role;
  }

  logout(): void {
    this.authService.logout();
  }

  ouvrirSidebar(): void {
    document.body.classList.toggle('sidebar-open');
  }

  toggleSidebarCollapse(): void {
    if (window.innerWidth < 992) {
      document.body.classList.toggle('sidebar-open');
    } else {
      const root = document.documentElement;
      root.classList.add('sidebar-anim');
      setTimeout(() => root.classList.remove('sidebar-anim'), 320);
      const isCollapsed = root.classList.toggle('sidebar-collapsed');
      document.body.classList.toggle('sidebar-collapsed', isCollapsed);
    }
  }
}
