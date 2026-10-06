import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    RouterModule
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar {

  organisationName = 'Fondation Espoir';

  constructor(
    private authService: AuthService
  ) {}

  get role(): string | null {
    return this.authService.getRole();
  }

  logout(): void {
    this.authService.logout();
  }
}