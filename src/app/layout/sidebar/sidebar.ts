import { Component } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  host: {
    'id': 'sidebar',
    'class': 'sidebar'
  },
  imports: [],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {}
