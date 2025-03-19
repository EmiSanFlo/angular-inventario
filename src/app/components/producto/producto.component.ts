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
export class ProductoComponent implements OnInit{
  productos : Producto[] = [];
  constructor(
    private productoService : ProductoService,
    private carritoService : CarritoService,
    private router : Router){}

  ngOnInit(){
      this.productos = this.productoService.obtenerProductos();
  }
  agregarAlCarrito(producto : any){
    this.carritoService.agregarProducto(producto);
  }
  irAlCarrito(){
    this.router.navigate(['/carrito'])
  }
  irAlInventario(){
    this.router.navigate(['/inventario'])
  }
}

