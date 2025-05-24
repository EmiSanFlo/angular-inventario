import { Routes } from '@angular/router';
import { ProductoComponent } from './components/producto/producto.component';
import { CarritoComponent } from './components/carrito/carrito.component';
import { InventarioComponent } from './components/inventario/inventario.component';
import { UsuarioComponent } from './components/usuario/usuario.component';

// Exporta la constante routes
export const routes: Routes = [
    { path: '', component: ProductoComponent },  // Ruta para el catálogo
    { path: 'carrito', component: CarritoComponent },  // Ruta para el carrito
    { path: 'inventario', component: InventarioComponent }, // Ruta para el inventario
    { path: 'producto', component: ProductoComponent },
    { path: 'usuario', component: UsuarioComponent } // Ruta para el usuario

];
