import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './admin-sidebar.html',
  styleUrl: './admin-sidebar.css'
})
export class AdminSidebar {
  private readonly authService = inject(AuthService);

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
