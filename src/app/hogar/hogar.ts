import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { FirebaseService, Product, db } from '../services/firebase.service';
import { Unsubscribe, collection, addDoc } from 'firebase/firestore';

@Component({
    selector: 'app-hogar',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <header id="pdf-header">
      <div class="header-content">
        <h1>Hogar</h1>
        
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
        <input type="text" [(ngModel)]="searchTerm" placeholder="Buscar productos..." (input)="filterAndSort()">
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

    <!-- Loading state -->
    <div class="loading-state" *ngIf="loading">
      <i class="fa-solid fa-spinner fa-spin"></i>
      <p>Cargando productos desde Firebase...</p>
    </div>

    <main class="container" id="capture-area" *ngIf="!loading">
      <div class="product-grid" [ngClass]="'cols-' + gridCols" [style.grid-template-columns]="gridCols === 'auto' ? 'repeat(auto-fill, minmax(320px, 1fr))' : 'repeat(' + gridCols + ', minmax(0, 1fr))'">
        <div class="product-card" *ngFor="let prod of filteredProducts; let i = index"
          [class.multi-image-card]="prod.imageUrls.length > 1"
          [ngStyle]="{'animation': 'fadeInUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) ' + (i * 0.1) + 's backwards'}">
          
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
              <button class="btn-edit-icon" (click)="openEditModal(prod)" title="Editar">
                <i class="fa-solid fa-pen"></i>
              </button>
              <button class="btn-delete-icon" (click)="confirmDelete(prod)" title="Eliminar">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="no-results" *ngIf="filteredProducts.length === 0">
        <i class="fa-solid fa-box-open"></i>
        <p>No se encontraron productos.</p>
      </div>
    </main>

    <!-- Image Modal -->
    <div class="image-modal" *ngIf="selectedImage" (click)="closeImage()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <button class="close-modal" (click)="closeImage()">
          <i class="fa-solid fa-xmark"></i>
        </button>
        <img [src]="selectedImage" class="modal-image">
        <p class="modal-caption">{{ selectedProduct?.title }}</p>
      </div>
    </div>

    <!-- Total Modal -->
    <div class="image-modal" *ngIf="isTotalVisible" (click)="hideTotalSum()">
      <div class="total-modal-content" (click)="$event.stopPropagation()">
        <h2 class="total-title">Total en Pantalla</h2>
        <p class="total-count">Basado en {{ filteredProducts.length }} productos</p>
        <span class="total-amount">{{ totalSum | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
        <button class="btn-close-total" (click)="hideTotalSum()">Cerrar</button>
      </div>
    </div>

    <!-- Edit/Add Modal -->
    <div class="image-modal" *ngIf="editModalOpen" (click)="closeEditModal()">
      <div class="edit-modal-content" (click)="$event.stopPropagation()">
        <button class="close-modal" (click)="closeEditModal()"><i class="fa-solid fa-xmark"></i></button>
        <h2>{{ editingProduct?.id ? 'Editar Producto' : 'Agregar Producto' }}</h2>

        <div class="form-group">
          <label>Título</label>
          <input type="text" [(ngModel)]="editForm.title" placeholder="Nombre del producto">
        </div>
        <div class="form-group">
          <label>Descripción</label>
          <textarea [(ngModel)]="editForm.description" rows="4" placeholder="Descripción del producto"></textarea>
        </div>
        <div class="form-group">
          <label>Precio (CLP)</label>
          <input type="number" [(ngModel)]="editForm.price" placeholder="Precio">
        </div>
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
          <label>{{ editingProduct?.id ? 'Cambiar imágenes (opcional - reemplaza todas)' : 'Imágenes del producto' }}</label>
          <input type="file" accept="image/*" multiple (change)="onFilesSelected($event)" #fileInput>
          
          <div class="multi-image-preview" *ngIf="previews.length">
             <div class="preview-item" *ngFor="let p of previews; let idx = index">
               <img [src]="p.url" alt="Preview">
               <button class="btn-remove-preview" (click)="removePreview(idx)">
                 <i class="fa-solid fa-xmark"></i>
               </button>
             </div>
          </div>
        </div>

        <div class="form-actions">
          <button class="btn-cancel" (click)="closeEditModal()">Cancelar</button>
          <button class="btn-save" (click)="saveProduct()" [disabled]="saving">
            <i class="fa-solid" [ngClass]="saving ? 'fa-spinner fa-spin' : 'fa-check'"></i>
            {{ saving ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div class="image-modal" *ngIf="deleteModalOpen" (click)="cancelDelete()">
      <div class="confirm-modal-content" (click)="$event.stopPropagation()">
        <i class="fa-solid fa-triangle-exclamation warning-icon"></i>
        <h2>¿Eliminar producto?</h2>
        <p>Esta acción eliminará <strong>{{ productToDelete?.title }}</strong> tanto de Firestore como de Storage. No se puede deshacer.</p>
        <div class="form-actions">
          <button class="btn-cancel" (click)="cancelDelete()">Cancelar</button>
          <button class="btn-delete-confirm" (click)="deleteProduct()" [disabled]="deleting">
            <i class="fa-solid" [ngClass]="deleting ? 'fa-spinner fa-spin' : 'fa-trash'"></i>
            {{ deleting ? 'Eliminando...' : 'Sí, eliminar' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class HogarComponent implements OnInit, OnDestroy {
    searchTerm = '';
    sortOrder = 'none';
    gridCols = typeof window !== 'undefined' && window.innerWidth <= 768 ? '1' : '4';
    showFilters = true;

    filteredProducts: Product[] = [];
    allProducts: Product[] = [];
    selectedProduct: Product | null = null;
    selectedImage: string | null = null;
    isTotalVisible = false;
    totalSum = 0;
    loading = true;

    // Edit/Add modal
    editModalOpen = false;
    editingProduct: Product | null = null;
    editForm: { title: string, description: string, price: number, orientation: 'square' | 'portrait' | 'landscape', condition?: 'Nuevo' | 'Como Nuevo' | 'Usado' | null } = { 
        title: '', description: '', price: 0, orientation: 'square', condition: null
    };
    previews: { url: string, path?: string, file?: File }[] = [];
    saving = false;

    // Delete modal
    deleteModalOpen = false;
    productToDelete: Product | null = null;
    deleting = false;

    private unsubscribe?: Unsubscribe;

    constructor(public fb: FirebaseService) {}

    ngOnInit() {
        this.unsubscribe = this.fb.listenProducts('hogar', (products) => {
            this.allProducts = products;
            this.loading = false;
            this.filterAndSort();
        });
        // If no products arrive in 3s, stop loading
        setTimeout(() => { this.loading = false; }, 3000);
    }

    ngOnDestroy() {
        this.unsubscribe?.();
    }

    filterAndSort() {
        const search = this.searchTerm.toLowerCase().trim();
        let result = this.allProducts.filter(p =>
            p.title.toLowerCase().includes(search) ||
            p.description.toLowerCase().includes(search)
        );
        if (this.sortOrder === 'asc') result.sort((a, b) => a.price - b.price);
        else if (this.sortOrder === 'desc') result.sort((a, b) => b.price - a.price);
        this.filteredProducts = result;
        this.totalSum = result.reduce((acc, p) => acc + p.price, 0);
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

    hideTotalSum() {
        this.isTotalVisible = false;
        document.body.style.overflow = 'auto';
    }

    // ---- Edit / Add ----
    openAddModal() {
        this.editingProduct = null;
        this.editForm = { title: '', description: '', price: 0, orientation: 'square', condition: null };
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
            orientation: product.orientation || 'square',
            condition: product.condition || null
        };
        // Load existing images into previews
        this.previews = product.imageUrls ? product.imageUrls.map((url, i) => ({
            url: url,
            path: product.storagePaths?.[i]
        })) : [];
        this.editModalOpen = true;
        document.body.style.overflow = 'hidden';
    }

    closeEditModal() {
        this.editModalOpen = false;
        this.editingProduct = null;
        document.body.style.overflow = 'auto';
    }

    onFilesSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files?.length) {
            const files = Array.from(input.files);
            
            files.forEach(file => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.previews.push({
                        url: e.target?.result as string,
                        file: file
                    });
                };
                reader.readAsDataURL(file);
            });
            // Reset input so they can pick same files again if they want
            input.value = '';
        }
    }

    removePreview(index: number) {
        this.previews.splice(index, 1);
    }

    async saveProduct() {
        if (!this.editForm.title.trim()) return;
        if (!this.previews.length) {
            alert('El producto debe tener al menos una imagen.');
            return;
        }
        this.saving = true;
        try {
            // 1. Separate existing URLs vs new Files to upload
            const existingUrls: string[] = [];
            const existingPaths: string[] = [];
            const filesToUpload: File[] = [];

            this.previews.forEach(p => {
                if (p.file) {
                    filesToUpload.push(p.file);
                } else if (p.url && p.path) {
                    existingUrls.push(p.url);
                    existingPaths.push(p.path);
                }
            });

            // 2. Upload new files
            let uploadedUrls: string[] = [];
            let uploadedPaths: string[] = [];
            if (filesToUpload.length) {
                const res = await this.fb.uploadImages(filesToUpload, 'hogar');
                uploadedUrls = res.urls;
                uploadedPaths = res.storagePaths;
            }

            // 3. Combine
            const finalUrls = [...existingUrls, ...uploadedUrls];
            const finalPaths = [...existingPaths, ...uploadedPaths];

            // 4. Update or Add
            if (!this.editingProduct?.id) {
                // ADD
                await this.fb.addProduct({
                    title: this.editForm.title,
                    description: this.editForm.description,
                    price: this.editForm.price,
                    category: 'hogar',
                    orientation: this.editForm.orientation,
                    condition: this.editForm.condition,
                    imageUrls: finalUrls,
                    storagePaths: finalPaths
                } as any, []); // Pass empty array as we already uploaded
            } else {
                // UPDATE
                // We should also delete from storage the images that were removed
                const pathsToDelete = (this.editingProduct.storagePaths || [])
                    .filter(path => !existingPaths.includes(path));
                
                if (pathsToDelete.length) {
                    await this.fb.deleteImages(pathsToDelete);
                }

                await this.fb.updateProduct(this.editingProduct.id, { 
                    title: this.editForm.title, 
                    description: this.editForm.description, 
                    price: this.editForm.price,
                    orientation: this.editForm.orientation,
                    condition: this.editForm.condition,
                    imageUrls: finalUrls,
                    storagePaths: finalPaths
                });
            }
            this.closeEditModal();
        } catch (e) {
            console.error(e);
            alert('Error al guardar. Revisa la consola.');
        }
        this.saving = false;
    }

    // ---- Delete ----
    confirmDelete(product: Product) {
        this.productToDelete = product;
        this.deleteModalOpen = true;
        document.body.style.overflow = 'hidden';
    }

    cancelDelete() {
        this.deleteModalOpen = false;
        this.productToDelete = null;
        document.body.style.overflow = 'auto';
    }

    async deleteProduct() {
        if (!this.productToDelete) return;
        this.deleting = true;
        try {
            await this.fb.deleteProduct(this.productToDelete);
        } catch (e) {
            console.error(e);
        }
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
            if (header) {
                const headerClone = header.cloneNode(true) as HTMLElement;
                headerClone.querySelector('.pdf-container')?.remove();
                tempDiv.appendChild(headerClone);
            }
            tempDiv.appendChild(element.cloneNode(true) as HTMLElement);
            document.body.appendChild(tempDiv);
            await new Promise(r => setTimeout(r, 100));
            const canvas = await html2canvas(tempDiv, { scale: 2, useCORS: true, backgroundColor: '#FFFFFF', removeContainer: true });
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const imgWidth = 210;
            const pageHeight = (canvas.height * imgWidth) / canvas.width;
            const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: [imgWidth, pageHeight] });
            pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, pageHeight);
            pdf.save('Venta_Hogar_Allinson_Hogar.pdf');
            document.body.removeChild(tempDiv);
        } catch (error) {
            window.print();
        } finally {
            document.body.classList.remove('pdf-capture-mode');
            show(nav); show(filters); show(totalBar); show(pdfBtns);
        }
    }
}
