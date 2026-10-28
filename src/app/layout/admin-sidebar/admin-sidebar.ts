import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatIconModule
  ],
  templateUrl: './admin-sidebar.html',
  styleUrl: './admin-sidebar.css'
})
export class AdminSidebar {
  private readonly authService = inject(AuthService);
  // Navigation: Bénéficiaires & Partenaires et Administrateurs
  navVersion = '2.0';

  isSuperAdmin(): boolean {
    return this.authService.isSuperAdmin();
  }

  logout(): void {
    this.authService.logout();
  }

  fermerSidebar(): void {
    document.body.classList.remove('sidebar-open');
    if (window.innerWidth >= 992) {
      document.documentElement.classList.toggle('sidebar-collapsed');
    }
  }
}
