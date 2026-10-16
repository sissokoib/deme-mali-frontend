import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    MatIcon
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
  }
}