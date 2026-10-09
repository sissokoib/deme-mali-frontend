import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rapport-technique-detail',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './rapport-technique-detail.html',
  styleUrl: './rapport-technique-detail.css'
})
export class RapportTechniqueDetailComponent {}
