import { Routes } from '@angular/router';
import { HogarComponent } from './hogar/hogar';
import { RopaComponent } from './ropa/ropa';
import { LicoresComponent } from './licores/licores';
import { TestComponent } from './test/test';

export const routes: Routes = [
    { path: '', component: HogarComponent },
    { path: 'ropa', component: RopaComponent },
    { path: 'licores', component: LicoresComponent },
    { path: 'test', component: TestComponent },
    { path: '**', redirectTo: '' }
];
