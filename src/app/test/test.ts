import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirebaseService, Product } from '../services/firebase.service';
import { Unsubscribe } from 'firebase/firestore';

@Component({
  selector: 'app-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="test-page-container">
      <div class="vintage-layout">
        <!-- Products list -->
        <div class="product-list" *ngIf="!loading">
          <div class="vintage-card" *ngFor="let prod of allProducts.slice(0, 10); let i = index">
            
            <div class="vintage-corner top-left"></div>
            <div class="vintage-corner top-right"></div>
            <div class="vintage-corner bottom-left"></div>
            <div class="vintage-corner bottom-right"></div>

            <div class="image-wrapper">
              <div class="image-circle">
                <img [src]="prod.imageUrls[0]" [alt]="prod.title" crossorigin="anonymous">
              </div>
            </div>
            
            <div class="card-details">
              <h3>{{ prod.title }}</h3>
              <p>{{ prod.description }}</p>
              <span class="card-price">{{ prod.price | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
            </div>
          </div>
          
          <div *ngIf="allProducts.length === 0" class="no-results">
            No se encontraron productos en Hogar.
          </div>
        </div>

        <div class="loading-state" *ngIf="loading">
          <p>Cargando productos...</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');

    .test-page-container {
      background-color: #8c2628; /* Crimson red */
      background-image: url('data:image/svg+xml;utf8,<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g fill="%2373181a" fill-opacity="0.3"><path d="M50 25c-5 0-10 5-15 10-5-5-10-10-15-10s-10 5-15 10c0 15 20 25 30 40 10-15 30-25 30-40 0-5-5-10-15-10z"/></g></svg>');
      background-size: 150px 150px;
      min-height: 100vh;
      font-family: 'Playfair Display', serif;
      display: flex;
      justify-content: center;
      padding: 3rem 1rem;
    }

    .vintage-layout {
      width: 100%;
      max-width: 500px; /* Mobile width */
    }

    .loading-state, .no-results {
      text-align: center;
      color: #e6dac3;
      font-size: 1.2rem;
    }

    .vintage-card {
      position: relative;
      border: 1.5px solid #dcb274;
      border-radius: 4px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      display: flex;
      align-items: center;
      gap: 1.5rem;
      background-color: transparent;
    }

    /* Ornate Corners using pseudo elements or simple CSS styling */
    .vintage-corner {
      position: absolute;
      width: 25px;
      height: 25px;
      border: 2px solid transparent;            
    }

    .vintage-corner.top-left {
      top: -6px;
      left: -6px;
      border-top-color: #dcb274;
      border-left-color: #dcb274;
      border-radius: 12px 0 0 0;
    }
    .vintage-corner.top-left::after { content: ''; position: absolute; top: 3px; left: 3px; width: 6px; height: 6px; border-radius: 50%; background: #dcb274; }

    .vintage-corner.top-right {
      top: -6px;
      right: -6px;
      border-top-color: #dcb274;
      border-right-color: #dcb274;
      border-radius: 0 12px 0 0;
    }
    .vintage-corner.top-right::after { content: ''; position: absolute; top: 3px; right: 3px; width: 6px; height: 6px; border-radius: 50%; background: #dcb274; }

    .vintage-corner.bottom-left {
      bottom: -6px;
      left: -6px;
      border-bottom-color: #dcb274;
      border-left-color: #dcb274;
      border-radius: 0 0 0 12px;
    }
    .vintage-corner.bottom-left::after { content: ''; position: absolute; bottom: 3px; left: 3px; width: 6px; height: 6px; border-radius: 50%; background: #dcb274; }

    .vintage-corner.bottom-right {
      bottom: -6px;
      right: -6px;
      border-bottom-color: #dcb274;
      border-right-color: #dcb274;
      border-radius: 0 0 12px 0;
    }
    .vintage-corner.bottom-right::after { content: ''; position: absolute; bottom: 3px; right: 3px; width: 6px; height: 6px; border-radius: 50%; background: #dcb274; }

    /* Card Contents */
    .image-wrapper {
      flex-shrink: 0;
    }

    .image-circle {
      width: 110px;
      height: 110px;
      border-radius: 50%;
      background-color: #f6ebd8;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
      box-shadow: inset 0px 4px 6px rgba(0, 0, 0, 0.2);
      border: 2px solid transparent;
    }

    .image-circle img {
      width: 80%;
      height: 80%;
      object-fit: cover;
      /* If images have backgrounds they can show, but this is a nice vintage look */
      mix-blend-mode: multiply; /* Optional: might make white backgrounds transparent against the cream circle */
    }

    .card-details {
      color: #e6dac3; /* Cream / pale gold text */
      text-align: left;
    }

    .card-details h3 {
      font-family: 'Great Vibes', cursive;
      font-size: 2.2rem;
      font-weight: 400;
      margin: 0 0 0.2rem 0;
      line-height: 1.1;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
    }

    .card-details p {
      font-size: 0.95rem;
      margin: 0 0 1rem 0;
      line-height: 1.4;
      opacity: 0.9;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .card-price {
      display: block;
      font-size: 1.4rem;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
  `]
})
export class TestComponent implements OnInit, OnDestroy {
    allProducts: Product[] = [];
    loading = true;
    private unsubscribe?: Unsubscribe;

    constructor(public fb: FirebaseService) {}

    ngOnInit() {
        document.body.classList.add('hide-header'); // Hide global nav and footer

        // Fetch specific collection or hogar by default to test styles
        this.unsubscribe = this.fb.listenProducts('hogar', (products) => {
            this.allProducts = products;
            this.loading = false;
        });

        setTimeout(() => { this.loading = false; }, 3000);
    }

    ngOnDestroy() {
        document.body.classList.remove('hide-header');
        this.unsubscribe?.();
    }
}
