import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rapport-besoin-detail',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './rapport-besoin-detail.html',
  styleUrl: './rapport-besoin-detail.css'
})
export class RapportBesoinDetailComponent {}
