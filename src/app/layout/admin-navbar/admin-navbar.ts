import { Component, inject } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
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
export class AdminNavbar {
  private readonly authService = inject(AuthService);

  readonly currentUser$ = this.authService.currentUser$;

  currentDate = new Date();

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
