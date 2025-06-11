import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ProductosService } from '../../servicios/productos.service';
import { CarritoService } from '../../services/carrito.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-producto-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule],
  //providers: [CarritoService, ProductosService], // <-- agrega esto si no están en el root
  templateUrl: './producto-detalle.component.html',
  styleUrls: ['./producto-detalle.component.css']
})

export class ProductoDetalleComponent implements OnInit {
  Math = Math;
  producto: any;
  resenas: any[] = [];
  descripcion: string = '';
  usuarioSesion: any = null;

  constructor(
    private route: ActivatedRoute,
    private carritoService: CarritoService,
    private productosService: ProductosService
  ) {}

  promedioPuntuacion: number = 0;

  ngOnInit() {
  const usuarioGuardado = localStorage.getItem('usuario');
  if (usuarioGuardado) {
    this.usuarioSesion = JSON.parse(usuarioGuardado);
  }
  console.log('Usuario en sesión:', this.usuarioSesion);

  const id = this.route.snapshot.paramMap.get('id');
  if (id) {
    this.productosService.getProductoDetalle(+id).subscribe(data => {
      this.producto = data.producto;
      this.descripcion = data.descripcion;
      this.resenas = data.resenas;
      this.cargarDatos(); // <-- Llama aquí, después de asignar las reseñas
    });
  }
}

enviarResena() {
  const id = this.route.snapshot.paramMap.get('id');
  if (id && this.usuarioSesion) {
    const resenaEnviar = {
      usuarioId: this.usuarioSesion.id,
      puntuacion: this.nuevaResena.puntuacion,
      comentario: this.nuevaResena.comentario
    };
    this.productosService.agregarResena(+id, resenaEnviar).subscribe(() => {
      // Vuelve a cargar las reseñas desde el backend
      this.productosService.getProductoDetalle(+id).subscribe(data => {
        this.resenas = data.resenas;
        this.nuevaResena = { puntuacion: null, comentario: '' };
        this.cargarDatos(); // <-- Llama aquí también
      });
    });
  }
}

  cargarDatos() {
  // ...tu lógica para cargar producto y resenas...
  // Después de cargar las reseñas:
  if (this.resenas && this.resenas.length) {
    const suma = this.resenas.reduce((acc, r) => acc + Number(r.Puntuacion), 0);
    this.promedioPuntuacion = suma / this.resenas.length;
  } else {
    this.promedioPuntuacion = 0;
  }
}

  nuevaResena = {
  puntuacion: null,
  comentario: ''
};


  agregarAlCarrito(producto: any) {
    this.carritoService.agregarProducto(producto);
  }
}