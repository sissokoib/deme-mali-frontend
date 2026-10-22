import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AdminSidebar } from '../admin-sidebar/admin-sidebar';
import { AdminNavbar } from '../admin-navbar/admin-navbar';

@Component({
  selector: 'app-admin-main',
  standalone: true,
  imports: [RouterOutlet, AdminSidebar, AdminNavbar],
  templateUrl: './admin-main.html',
  styleUrl: './admin-main.css'
})
export class AdminMain {
  fermerSidebar(): void {
    document.body.classList.remove('sidebar-open');
  }
}
