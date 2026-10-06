import { Component } from '@angular/core';
import { Sidebar } from '../sidebar/sidebar';
import { Navbar } from '../navbar/navbar';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-main',
  imports: [Sidebar, Navbar, RouterOutlet],
  templateUrl: './main.html',
  styleUrl: './main.css',
})
export class Main {}
