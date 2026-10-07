import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/utilisateur.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);
  private sub?: Subscription;

  user: User | null = null;
  currentDate = new Date();

  ngOnInit(): void {
    // Écoute en continu les changements de l'utilisateur
    this.sub = this.authService.currentUser$.subscribe(utilisateur => {
      this.user = utilisateur;
      
      // On force la mise à jour de la vue quoi qu'il arrive
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    // On nettoie l'abonnement quand on quitte la page
    this.sub?.unsubscribe();
  }

}