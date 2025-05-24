import { Component, OnInit } from '@angular/core';
import { Producto } from '../../models/producto';
import { ProductoService } from '../../services/producto.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CarritoService } from '../../services/carrito.service';
import { InventarioComponent } from "../inventario/inventario.component";

@Component({
  standalone:true,
  selector: 'app-producto',
  imports: [CommonModule],
  templateUrl: './producto.component.html',
  styleUrl: './producto.component.css'

})
export class ProductoComponent implements OnInit {
  productos: Producto[] = [];
  rolUsuario: string | null = null;

  constructor(
    private productoService: ProductoService,
    private carritoService: CarritoService,
    private router: Router
  ) {}

  ngOnInit() {
    // Lee el rol del usuario desde localStorage
    const usuarioStr = localStorage.getItem('usuario');
    if (usuarioStr) {
      const usuario = JSON.parse(usuarioStr);
      this.rolUsuario = usuario.rol;
    }

    fetch('http://localhost:3000/productos')
      .then(res => res.json())
      .then(data => {
        this.productos = data;
      })
      .catch(err => {
        console.error('Error al cargar productos:', err);
      });
  }

  agregarAlCarrito(producto: any) {
    this.carritoService.agregarProducto(producto);
  }

  irAlCarrito() {
    this.router.navigate(['/carrito']);
  }

  irAlInventario() {
    this.router.navigate(['/inventario']);
  }
}