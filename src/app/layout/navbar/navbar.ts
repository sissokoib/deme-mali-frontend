import { Component, OnInit, inject } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    AsyncPipe,
    CommonModule,
    RouterLink
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnInit {

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly currentUser$ = this.authService.currentUser$;

  currentDate = new Date();

  ngOnInit(): void {
    const role = this.authService.getRole();
    if (role && role !== 'ORGANISATIONPARTENAIRE') {
      if (role === 'ADMIN') {
        this.router.navigate(['/admin/dashboard']);
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

    return initiales || 'OP';
  }

  obtenirLibelleRole(user?: any): string {
    if (!user) return 'Organisation Partenaire';
    if (user.typeOrganisation) return user.typeOrganisation;
    const roleNorm = (user.role || '').toUpperCase().replace('ROLE_', '').replace(/_/g, '').trim();
    if (roleNorm === 'ORGANISATIONPARTENAIRE') return 'Organisation Partenaire';
    if (roleNorm === 'ADMIN') return 'Administrateur';
    if (roleNorm === 'DONATEUR') return 'Donateur';
    if (roleNorm === 'BENEFICIAIRE') return 'Bénéficiaire';
    return user.role || 'Organisation Partenaire';
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
