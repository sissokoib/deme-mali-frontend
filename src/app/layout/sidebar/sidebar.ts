import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';


@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
  
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar {

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