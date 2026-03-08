import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { FirebaseService } from './services/firebase.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrls: [] // Los estilos ahora son globales en styles.css
})
export class AppComponent {
  title = 'Venta Hogar Allinson';

  constructor(public fb: FirebaseService) {}

  login() {
    this.fb.loginWithGoogle();
  }

  logout() {
    this.fb.logout();
  }
}
