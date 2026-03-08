import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { FirebaseService, Product } from '../services/firebase.service';
import { Unsubscribe } from 'firebase/firestore';

@Component({
    selector: 'app-licores',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <header id="pdf-header">
      <div class="header-content">
        <h1>Pack de licores</h1>
        <div class="pdf-container">
          <button class="btn-toggle-filters" (click)="showFilters = !showFilters">
            <i class="fa-solid" [ngClass]="showFilters ? 'fa-eye-slash' : 'fa-eye'"></i>
            {{ showFilters ? 'Hide' : 'Show' }} Filters
          </button>
          <ng-container *ngIf="showFilters">
            <button *ngIf="(fb.isAdmin$ | async)" class="btn-add" (click)="openAddModal()">
              <i class="fa-solid fa-plus"></i> Agregar Producto
            </button>
            <button class="btn-pdf" (click)="downloadPDF()">
              <i class="fa-solid fa-file-pdf"></i>
              Descargar PDF
            </button>
          </ng-container>
        </div>
      </div>
    </header>

    <div class="filters-container" *ngIf="showFilters">
      <div class="search-box">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input type="text" [(ngModel)]="searchTerm" placeholder="Buscar..." (input)="filterAndSort()">
      </div>
      <div class="sort-filter">
        <i class="fa-solid fa-sort"></i>
        <select [(ngModel)]="sortOrder" (change)="filterAndSort()">
          <option value="none">Ordenar por precio...</option>
          <option value="asc">Precio: Menor a Mayor ↑</option>
          <option value="desc">Precio: Mayor a Menor ↓</option>
        </select>
      </div>
      <div class="sort-filter">
        <i class="fa-solid fa-table-columns"></i>
        <select [(ngModel)]="gridCols">
          <option value="auto">Columnas: Automático</option>
          <option value="1">1 por fila</option>
          <option value="2">2 por fila</option>
          <option value="3">3 por fila</option>
          <option value="4">4 por fila</option>
          <option value="5">5 por fila</option>
          <option value="6">6 por fila</option>
        </select>
      </div>
    </div>

    <div class="total-bar" *ngIf="showFilters">
      <div class="total-display">
        <i class="fa-solid fa-calculator"></i> Total Inventario: 
        <span class="total-amount-inline">{{ totalSum | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
      </div>
      <span class="product-count"><i class="fa-solid fa-box"></i> {{ filteredProducts.length }} productos</span>
    </div>

    <div class="loading-state" *ngIf="loading">
      <i class="fa-solid fa-spinner fa-spin"></i>
      <p>Cargando productos desde Firebase...</p>
    </div>

    <main class="container licores-container" id="capture-area" *ngIf="!loading">
      <div class="product-grid licores-grid" [ngClass]="'cols-' + gridCols" [style.grid-template-columns]="gridCols === 'auto' ? 'minmax(0, 1fr)' : 'repeat(' + gridCols + ', minmax(0, 1fr))'">
        <div class="product-card licores-full-card" *ngFor="let prod of filteredProducts; let i = index"
          [ngStyle]="{'animation': 'fadeInUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) ' + (i * 0.05) + 's backwards'}">
          
          <div class="image-scroller" [ngClass]="{'multi-image': prod.imageUrls.length > 1}">
            <div class="product-image-container" *ngFor="let url of prod.imageUrls; let first = first" 
                 [ngClass]="prod.orientation" (click)="openImage(prod, url)">
              <span class="condition-badge" *ngIf="first && prod.condition">{{ prod.condition }}</span>
              <img [src]="url" [alt]="prod.title" class="product-image" crossorigin="anonymous">
            </div>
          </div>

          <h3 class="product-title">{{ prod.title }}</h3>
          <p class="product-desc">{{ prod.description }}</p>
          <div class="product-footer">
            <span class="product-price">{{ prod.price | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
            <div class="product-actions" *ngIf="showFilters && (fb.isAdmin$ | async)">
              <button class="btn-edit-icon" (click)="openEditModal(prod)" title="Editar"><i class="fa-solid fa-pen"></i></button>
              <button class="btn-delete-icon" (click)="confirmDelete(prod)" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>
        </div>
      </div>
      <div class="no-results" *ngIf="filteredProducts.length === 0">
        <i class="fa-solid fa-box-open"></i>
        <p>No se encontraron productos.</p>
      </div>
    </main>

    <!-- Modals -->
    <div class="image-modal" *ngIf="selectedImage" (click)='closeImage()'>
      <div class="modal-content" (click)="$event.stopPropagation()">
        <button class="close-modal" (click)="closeImage()"><i class="fa-solid fa-xmark"></i></button>
        <img [src]="selectedImage" class="modal-image">
        <p class="modal-caption">{{ selectedProduct?.title }}</p>
      </div>
    </div>

    <!-- Total Modal -->
    <div class="image-modal" *ngIf="isTotalVisible" (click)="hideTotalSum()">
      <div class="total-modal-content" (click)="$event.stopPropagation()">
        <h2 class="total-title">Total Seccion Licores</h2>
        <span class="total-amount">{{ totalSum | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
        <button class="btn-close-total" (click)="hideTotalSum()">Cerrar</button>
      </div>
    </div>

    <!-- Edit/Add Modal -->
    <div class="image-modal" *ngIf="editModalOpen" (click)="closeEditModal()">
      <div class="edit-modal-content" (click)="$event.stopPropagation()">
        <button class="close-modal" (click)="closeEditModal()"><i class="fa-solid fa-xmark"></i></button>
        <h2>{{ editingProduct?.id ? 'Editar' : 'Agregar' }} Producto</h2>
        <div class="form-group"><label>Título</label><input type="text" [(ngModel)]="editForm.title" placeholder="Título"></div>
        <div class="form-group"><label>Descripción</label><textarea [(ngModel)]="editForm.description" rows="3" placeholder="Descripción"></textarea></div>
        <div class="form-group"><label>Precio</label><input type="number" [(ngModel)]="editForm.price" placeholder="Precio"></div>
        <div class="form-group">
          <label>Orientación de Imágenes</label>
          <select [(ngModel)]="editForm.orientation">
             <option value="square">Cuadrado (1:1)</option>
             <option value="portrait">Vertical (3:4)</option>
             <option value="landscape">Horizontal (16:9)</option>
          </select>
        </div>
        <div class="form-group">
          <label>Condición del Producto (Opcional)</label>
          <select [(ngModel)]="editForm.condition">
             <option [ngValue]="null">Ninguno</option>
             <option value="Nuevo">Nuevo</option>
             <option value="Como Nuevo">Como Nuevo</option>
             <option value="Usado">Usado</option>
          </select>
        </div>
        <div class="form-group">
          <label>{{ editingProduct?.id ? 'Nuevas imágenes (reemplazar todas)' : 'Imágenes' }}</label>
          <input type="file" accept="image/*" multiple (change)="onFilesSelected($event)">
          <div class="multi-image-preview" *ngIf="previews.length">
             <div class="preview-item" *ngFor="let p of previews; let idx = index">
               <img [src]="p.url">
               <button class="btn-remove-preview" (click)="removePreview(idx)"><i class="fa-solid fa-xmark"></i></button>
             </div>
          </div>
        </div>
        <div class="form-actions">
          <button class="btn-cancel" (click)='closeEditModal()'>Cancelar</button>
          <button class="btn-save" (click)="saveProduct()" [disabled]="saving">
            <i class="fa-solid" [ngClass]="saving ? 'fa-spinner fa-spin' : 'fa-check'"></i>
            {{ saving ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirm Modal -->
    <div class="image-modal" *ngIf="deleteModalOpen" (click)="cancelDelete()">
      <div class="confirm-modal-content" (click)="$event.stopPropagation()">
        <i class="fa-solid fa-triangle-exclamation warning-icon"></i>
        <h2>¿Eliminar?</h2>
        <p>Eliminarás <strong>{{ productToDelete?.title }}</strong> de Firebase.</p>
        <div class="form-actions">
          <button class="btn-cancel" (click)="cancelDelete()">No</button>
          <button class="btn-delete-confirm" (click)="deleteProduct()" [disabled]="deleting">
            <i class="fa-solid" [ngClass]="deleting ? 'fa-spinner fa-spin' : 'fa-trash'"></i>
            {{ deleting ? 'Eliminando...' : 'Sí, eliminar' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .licores-grid {
      display: block !important;
    }
    .licores-container {
      max-width: 1200px !important;
      margin: 0 auto !important;
      padding: 0 2rem;
    }
    .licores-full-card {
      display: flex;
      flex-direction: column;
      gap: 0;
      align-items: center;
      width: 100%;
      margin: 0 0 3rem 0;
      padding: 0;
      text-align: center;
      overflow: hidden;
    }
    .product-image-container {
      width: 100%;
      max-width: 100%;
      height: auto !important;
      margin-bottom: 0 !important;
      border-radius: 28px 28px 0 0;
      overflow: hidden;
    }
    .product-image {
      width: 100%;
      height: auto;
      max-height: 75vh;
      object-fit: cover;
      transform: scale(1.1); /* Zoom suave para centrar la atención */
    }
    .product-info-wrapper {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem 1.5rem;
    }
    .product-title {
      font-size: 2.2rem !important;
      margin-bottom: 1rem !important;
    }
    .product-desc {
      font-size: 1.25rem !important;
      line-height: 1.8 !important;
      margin: 0 auto 2rem !important;
    }
    @media (max-width: 768px) {
      .product-title { font-size: 1.8rem !important; }
      .product-desc { font-size: 1.1rem !important; }
    }

    /* Image Scroller */
    .image-scroller {
      display: flex;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      -webkit-overflow-scrolling: touch;
      width: 100%;
      max-width: 100%;
      border-radius: 0;
      box-shadow: none;
      background-color: transparent;
      margin-bottom: 0;
    }

    .image-scroller.multi-image {
      padding-bottom: 10px; /* Space for scrollbar */
    }

    .image-scroller::-webkit-scrollbar {
      height: 8px;
    }

    .image-scroller::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 10px;
    }

    .image-scroller::-webkit-scrollbar-thumb {
      background: #888;
      border-radius: 10px;
    }

    .image-scroller::-webkit-scrollbar-thumb:hover {
      background: #555;
    }

    .image-scroller .product-image-container {
      flex: 0 0 auto;
      scroll-snap-align: start;
      width: 100%;
      height: auto; /* Adjust based on orientation */
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
      cursor: zoom-in;
      background-color: transparent; /* Remove black background */
      border: 1px solid #ccc; /* Thin subtle border */
      border-radius: 8px;
    }

    .image-scroller .product-image-container.square {
      aspect-ratio: 1 / 1;
    }

    .image-scroller .product-image-container.portrait {
      aspect-ratio: 3 / 4;
    }

    .image-scroller .product-image-container.landscape {
      aspect-ratio: 16 / 9;
    }

    .image-scroller .product-image {
      width: 100%;
      height: 100%;
      object-fit: contain;
      border-radius: 20px;
    }

    /* Multi-image preview in modal */
    .multi-image-preview {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 10px;
    }

    .preview-item {
      position: relative;
      width: 100px;
      height: 100px;
      border: 1px solid #ddd;
      border-radius: 4px;
      overflow: hidden;
    }

    .preview-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .btn-remove-preview {
      position: absolute;
      top: 2px;
      right: 2px;
      background-color: rgba(255, 0, 0, 0.7);
      color: white;
      border: none;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 0.7em;
      cursor: pointer;
      z-index: 10;
    }

  `]
})
export class LicoresComponent implements OnInit, OnDestroy {
    searchTerm = '';
    sortOrder = 'none';
    gridCols = '1';
    showFilters = true;

    filteredProducts: Product[] = [];
    allProducts: Product[] = [];
    selectedProduct: Product | null = null;
    selectedImage: string | null = null;
    loading = true;
    isTotalVisible = false;
    totalSum = 0;

    editModalOpen = false;
    editingProduct: Product | null = null;
    editForm: { title: string, description: string, price: number, orientation: 'square' | 'portrait' | 'landscape', condition?: 'Nuevo' | 'Como Nuevo' | 'Usado' | null } = { 
        title: '', description: '', price: 0, orientation: 'landscape', condition: null 
    };
    previews: { url: string, file?: File, path?: string }[] = [];
    saving = false;

    deleteModalOpen = false;
    productToDelete: Product | null = null;
    deleting = false;

    private unsubscribe?: Unsubscribe;

    constructor(public fb: FirebaseService) {}

    ngOnInit() {
        this.unsubscribe = this.fb.listenProducts('licores', (products) => {
            this.allProducts = products;
            this.loading = false;
            this.filterAndSort();
        });
        setTimeout(() => { this.loading = false; }, 3000);
    }

    ngOnDestroy() { this.unsubscribe?.(); }

    filterAndSort() {
        const search = this.searchTerm.toLowerCase().trim();
        let res = this.allProducts.filter(p =>
            p.title.toLowerCase().includes(search) || p.description.toLowerCase().includes(search)
        );
        if (this.sortOrder === 'asc') res.sort((a, b) => a.price - b.price);
        else if (this.sortOrder === 'desc') res.sort((a, b) => b.price - a.price);
        this.filteredProducts = res;
        this.totalSum = res.reduce((acc, p) => acc + p.price, 0);
    }

    openImage(product: Product, url: string) {
        this.selectedProduct = product;
        this.selectedImage = url;
        document.body.style.overflow = 'hidden';
    }

    closeImage() {
        this.selectedProduct = null;
        this.selectedImage = null;
        document.body.style.overflow = 'auto';
    }

    showTotalSum() {
        this.totalSum = this.filteredProducts.reduce((acc, p) => acc + p.price, 0);
        this.isTotalVisible = true;
        document.body.style.overflow = 'hidden';
    }

    hideTotalSum() { this.isTotalVisible = false; document.body.style.overflow = 'auto'; }

    openAddModal() {
        this.editingProduct = null;
        this.editForm = { title: '', description: '', price: 0, orientation: 'landscape', condition: null };
        this.previews = [];
        this.editModalOpen = true;
        document.body.style.overflow = 'hidden';
    }

    openEditModal(product: Product) {
        this.editingProduct = product;
        this.editForm = { 
            title: product.title, 
            description: product.description, 
            price: product.price,
            orientation: product.orientation || 'landscape',
            condition: product.condition || null
        };
        this.previews = product.imageUrls ? product.imageUrls.map((url, i) => ({
            url: url,
            path: product.storagePaths?.[i]
        })) : [];
        this.editModalOpen = true;
        document.body.style.overflow = 'hidden';
    }

    closeEditModal() { this.editModalOpen = false; this.editingProduct = null; document.body.style.overflow = 'auto'; }

    onFilesSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files?.length) {
            const files = Array.from(input.files);
            files.forEach(f => {
                const reader = new FileReader();
                reader.onload = (e) => this.previews.push({
                    url: e.target?.result as string,
                    file: f
                });
                reader.readAsDataURL(f);
            });
            input.value = '';
        }
    }

    removePreview(i: number) { this.previews.splice(i, 1); }

    async saveProduct() {
        if (!this.editForm.title.trim()) return;
        if (!this.previews.length) { alert('El producto debe tener al menos una imagen.'); return; }
        this.saving = true;
        try {
            const existingUrls: string[] = [];
            const existingPaths: string[] = [];
            const filesToUpload: File[] = [];
            this.previews.forEach(p => {
                if (p.file) filesToUpload.push(p.file);
                else if (p.url && p.path) {
                    existingUrls.push(p.url);
                    existingPaths.push(p.path);
                }
            });

            let uploadedUrls: string[] = [];
            let uploadedPaths: string[] = [];
            if (filesToUpload.length) {
                const res = await this.fb.uploadImages(filesToUpload, 'licores');
                uploadedUrls = res.urls;
                uploadedPaths = res.storagePaths;
            }

            const finalUrls = [...existingUrls, ...uploadedUrls];
            const finalPaths = [...existingPaths, ...uploadedPaths];

            if (!this.editingProduct?.id) {
                await this.fb.addProduct({
                    ...this.editForm,
                    category: 'licores',
                    imageUrls: finalUrls,
                    storagePaths: finalPaths
                } as any, []);
            } else {
                const pathsToDelete = (this.editingProduct.storagePaths || [])
                    .filter(path => !existingPaths.includes(path));
                if (pathsToDelete.length) await this.fb.deleteImages(pathsToDelete);

                await this.fb.updateProduct(this.editingProduct.id, { 
                    ...this.editForm,
                    imageUrls: finalUrls,
                    storagePaths: finalPaths
                });
            }
            this.closeEditModal();
        } catch (e) { console.error(e); alert('Error al guardar'); }
        this.saving = false;
    }

    confirmDelete(p: Product) { this.productToDelete = p; this.deleteModalOpen = true; document.body.style.overflow = 'hidden'; }
    cancelDelete() { this.deleteModalOpen = false; this.productToDelete = null; document.body.style.overflow = 'auto'; }

    async deleteProduct() {
        if (!this.productToDelete) return;
        this.deleting = true;
        try { await this.fb.deleteProduct(this.productToDelete); } catch (e) { console.error(e); }
        this.deleting = false;
        this.cancelDelete();
    }

    async downloadPDF() {
        const element = document.getElementById('capture-area') || document.body;
        const header = document.getElementById('pdf-header');
        const nav = document.querySelector('nav');
        const filters = document.querySelector('.filters-container');
        const totalBar = document.querySelector('.total-bar');
        const pdfBtns = document.querySelector('.pdf-container');
        const hide = (el: any) => el && (el.style.display = 'none');
        const show = (el: any, val = 'flex') => el && (el.style.display = val);
        hide(nav); hide(filters); hide(totalBar); hide(pdfBtns);
        document.body.classList.add('pdf-capture-mode');
        try {
            const tempDiv = document.createElement('div');
            tempDiv.style.cssText = 'position:absolute;top:-9999px;width:1200px;background:#FFFFFF;padding:40px;';
            tempDiv.classList.add('pdf-capture-mode');
            if (header) { const h = header.cloneNode(true) as HTMLElement; h.querySelector('.pdf-container')?.remove(); tempDiv.appendChild(h); }
            tempDiv.appendChild(element.cloneNode(true) as HTMLElement);
            document.body.appendChild(tempDiv);
            await new Promise(r => setTimeout(r, 100));
            const canvas = await html2canvas(tempDiv, { scale: 2, useCORS: true, backgroundColor: '#FFFFFF', removeContainer: true });
            const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: [210, (canvas.height * 210) / canvas.width] });
            pdf.addImage(canvas.toDataURL('image/jpeg', 1.0), 'JPEG', 0, 0, 210, (canvas.height * 210) / canvas.width);
            pdf.save('Venta_Hogar_Allinson_Licores.pdf');
            document.body.removeChild(tempDiv);
        } catch { window.print(); } finally {
            document.body.classList.remove('pdf-capture-mode');
            show(nav); show(filters); show(totalBar); show(pdfBtns);
        }
    }
}
