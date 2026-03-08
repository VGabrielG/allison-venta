import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe,
  DocumentData
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Product {
  id?: string;
  title: string;
  description: string;
  price: number;
  imageUrls: string[];
  category: 'hogar' | 'ropa' | 'licores';
  storagePaths?: string[];
  orientation: 'square' | 'portrait' | 'landscape';
  condition?: 'Nuevo' | 'Como Nuevo' | 'Usado' | null;
}

export const app = initializeApp(environment.firebase);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

@Injectable({ providedIn: 'root' })
export class FirebaseService {

  // AÑADE TUS CORREOS PERMITIDOS AQUÍ PARA QUE PUEDAN ADMINISTRAR
  private allowedEmails = ['allinson.boutique@gmail.com', 'tu.correo@gmail.com', 'gtefarikisopazo96@gmail.com', 'allisonleslie2809@gmail.com']; 
  
  public isAdmin$ = new BehaviorSubject<boolean>(false);
  public currentUser$ = new BehaviorSubject<User | null>(null);

  constructor() {
    onAuthStateChanged(auth, (user) => {
      this.currentUser$.next(user);
      if (user && user.email && this.allowedEmails.includes(user.email)) {
        this.isAdmin$.next(true);
      } else {
        this.isAdmin$.next(false);
      }
    });
  }

  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error("Login failed", e);
    }
  }

  async logout() {
    await signOut(auth);
  }

  /** Listen to all products in a category in real-time */
  listenProducts(
    category: 'hogar' | 'ropa' | 'licores',
    callback: (products: Product[]) => void
  ): Unsubscribe {
    const q = query(
      collection(db, 'products'),
      orderBy('title')
    );
    return onSnapshot(q, (snapshot) => {
      const all = snapshot.docs.map(d => {
        const data = d.data();
        // Backward compatibility: convert single imageUrl to array if needed
        const imageUrls = Array.isArray(data['imageUrls']) 
            ? data['imageUrls'] 
            : (data['imageUrl'] ? [data['imageUrl']] : []);
        const storagePaths = Array.isArray(data['storagePaths']) 
            ? data['storagePaths'] 
            : (data['storagePath'] ? [data['storagePath']] : []);

        return { 
            id: d.id, 
            ...data,
            imageUrls,
            storagePaths,
            orientation: data['orientation'] || 'square'
        } as Product;
      });
      callback(all.filter(p => p.category === category));
    });
  }

  /** Upload multiple images to storage, return { urls, storagePaths } */
  async uploadImages(files: File[], category: string): Promise<{ urls: string[]; storagePaths: string[] }> {
    const urls: string[] = [];
    const storagePaths: string[] = [];

    for (const file of files) {
      const path = `product-images/${category}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      urls.push(url);
      storagePaths.push(path);
    }
    return { urls, storagePaths };
  }

  /** Delete multiple images from storage */
  async deleteImages(paths: string[]): Promise<void> {
    for (const path of paths) {
      try {
        const storageRef = ref(storage, path);
        await deleteObject(storageRef);
      } catch (e) {
        console.warn('Could not delete image from storage:', path, e);
      }
    }
  }

  /** Add a new product with multiple images */
  async addProduct(
    data: Omit<Product, 'id' | 'imageUrls' | 'storagePaths'>,
    imageFiles: File[]
  ): Promise<void> {
    const { urls, storagePaths } = await this.uploadImages(imageFiles, data.category);
    await addDoc(collection(db, 'products'), {
      ...data,
      imageUrls: urls,
      storagePaths
    });
  }

  /** Update product data */
  async updateProduct(id: string, data: Partial<Product>): Promise<void> {
    const docRef = doc(db, 'products', id);
    await updateDoc(docRef, data);
  }

  /** Replace all product images */
  async replaceProductImages(product: Product, newImageFiles: File[]): Promise<void> {
    if (product.storagePaths?.length) {
      await this.deleteImages(product.storagePaths);
    }
    const { urls, storagePaths } = await this.uploadImages(newImageFiles, product.category);
    const docRef = doc(db, 'products', product.id!);
    await updateDoc(docRef, { imageUrls: urls, storagePaths });
  }

  /** Delete product and all its images */
  async deleteProduct(product: Product): Promise<void> {
    if (product.storagePaths?.length) {
      await this.deleteImages(product.storagePaths);
    }
    await deleteDoc(doc(db, 'products', product.id!));
  }

  /** Seed / migrate existing local products (run once) */
  async migrateProducts(localProducts: any[]): Promise<void> {
    for (const p of localProducts) {
      try {
        const response = await fetch(p.imageUrl);
        const blob = await response.blob();
        const fileName = p.imageUrl.split('/').pop() || 'image.jpg';
        const file = new File([blob], fileName, { type: blob.type });
        
        const { urls, storagePaths } = await this.uploadImages([file], p.category);
        await addDoc(collection(db, 'products'), {
          title: p.title,
          description: p.description,
          price: p.price,
          imageUrls: urls,
          storagePaths,
          category: p.category
        });
        console.log(`✅ Migrated: ${p.title}`);
      } catch (err) {
        console.error(`❌ Failed: ${p.title}`, err);
      }
    }
  }
}
