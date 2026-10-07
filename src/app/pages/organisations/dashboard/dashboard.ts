import { ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/utilisateur.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    AsyncPipe,
    DatePipe,
    RouterLink
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit{
  data = signal<User | null>(null);
  user!: any 

  private readonly authService = inject(AuthService);
 constructor(private drc: ChangeDetectorRef){}

  readonly currentUser$ = this.authService.currentUser$;
  ngOnInit(): void {
   
    this.getUser()
  }

  currentDate = new Date();

  getUser(){
    this.user= this.authService.getCurrentUser();
    console.log("user:", this.user)
    this.drc.detectChanges()
    

  }

}