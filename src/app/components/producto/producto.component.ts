import { Component, OnInit } from '@angular/core';
import { Producto } from '../../models/producto';
import { ProductoService } from '../../services/producto.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CarritoService } from '../../services/carrito.service';
import { FormsModule } from '@angular/forms';
import { InventarioComponent } from "../inventario/inventario.component";

@Component({
  standalone:true,
  selector: 'app-producto',
  imports: [CommonModule, FormsModule],
  templateUrl: './producto.component.html',
  styleUrl: './producto.component.css'

})
export class ProductoComponent implements OnInit {
  productos: Producto[] = [];
  rolUsuario: string | null = null;
  productosFiltrados: any[] = [];
  filtroGeneral: string = '';

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
      this.productosFiltrados = data;
    })
      .catch(err => {
        console.error('Error al cargar productos:', err);
      });
  }

  agregarAlCarrito(producto: any) {
    this.carritoService.agregarProducto(producto);
  }

  irAlCarrito() {
    const usuario = localStorage.getItem('usuario');
    if (usuario) {
      this.router.navigate(['/carrito']);
    } else {
      this.router.navigate(['/usuario']); // Ajusta la ruta si tu login tiene otro path
    }
  }

  irAlInventario() {
    this.router.navigate(['/inventario']);
  }
verDetalle(producto: any) {
  if (producto && producto.Id) {
    this.router.navigate(['/producto', producto.Id]);
  } else {
    alert('No se encontró el ID del producto');
  }
}

buscarProductos() {
  const filtro = this.filtroGeneral.trim().toLowerCase();
  this.productosFiltrados = this.productos.filter(producto => {
    const nombre = producto.Nombre?.toLowerCase() || '';
    const artista = producto.Artista?.toLowerCase() || '';
    // Si tienes géneros, descomenta la siguiente línea:
    // const generos = (producto.Generos || []).map(g => g.nombre?.toLowerCase()).join(' ');
    // return nombre.includes(filtro) || artista.includes(filtro) || generos.includes(filtro);
    return nombre.includes(filtro) || artista.includes(filtro);
  });
}
}