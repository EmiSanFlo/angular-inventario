import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router'; // Importar Router
import { CommonModule } from '@angular/common'; // Importar CommonModule
import { FormsModule } from '@angular/forms';
import { InventarioService } from '../../services/inventario.services'; // Ensure this path is correct
import { Producto } from '../../models/producto';
import { ProductoService } from '../../services/producto.service'; // Usar ProductoService
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.components.css'],
})
export class InventarioComponent {
  nuevoProducto: Producto = { Id: 0, Nombre: '', StockDisponible: 0, Precio: 0, ImagenPrincipal: '' };
  productos: Producto[] = [];

  constructor(private productoService: ProductoService, private inventarioService: InventarioService, private router: Router) {
    this.actualizarLista();
  }

  ngOnInit() {
    this.cargarProductos();
  }

  cargarProductos() {
    fetch('http://localhost:3000/productos')
      .then(res => res.json())
      .then(data => this.productos = data);
  }

  crearProducto() {
    fetch('http://localhost:3000/productos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.nuevoProducto)
    })
    .then(() => {
      this.nuevoProducto = { Id: 0, Nombre: '', StockDisponible: 0, Precio: 0, ImagenPrincipal: '' };
      this.cargarProductos();
    });
  }

 modificarProducto(producto: any) {
    const nuevoNombre = prompt('Nuevo nombre:', producto.Nombre);
    const nuevaCantidad = prompt('Nueva cantidad:', producto.StockDisponible);
    const nuevoPrecio = prompt('Nuevo precio:', producto.Precio);

    if (nuevoNombre && nuevaCantidad && nuevoPrecio) {
      const productoModificado = {
        ...producto,
        Nombre: nuevoNombre,
        StockDisponible: +nuevaCantidad,
        Precio: +nuevoPrecio
      };

      fetch(`http://localhost:3000/productos/${producto.Id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productoModificado)
      })
      .then(() => this.cargarProductos());
    }
  }

  eliminarProducto(id: number) {
    fetch(`http://localhost:3000/productos/${id}`, {
      method: 'DELETE'
    })
    .then(() => this.cargarProductos());
  }

  actualizarLista(): void {
  this.cargarProductos(); // Siempre usa la base de datos
}

  generarYGuardarXML(): void {
    const xmlContent = this.productoService.generarXML();
    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'inventario.xml';
    link.click();

    // Guardar el XML en localStorage
    localStorage.setItem('inventarioXML', xmlContent);
  }

  cargarCatalogoDesdeXML(event: any): void {
  const file: File = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      const xmlContent = reader.result as string;
      this.productoService.cargarCatalogoDesdeXML(xmlContent); // Llama al método del servicio
      this.actualizarLista(); // Actualiza la lista después de cargar el catálogo

      // Envía los productos al backend
      const productos = this.productoService.obtenerProductos(); // Obtén el arreglo de productos
      fetch('http://localhost:3000/productos/importar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productos)
      })
      .then(res => res.text())
      .then(msg => alert(msg))
      .catch(err => alert('Error al importar productos'));
    };
    reader.readAsText(file);
  }
}

  generarXML(): void {
    let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xmlContent += '<inventario>\n';

    this.productos.forEach((producto) => {
      xmlContent += '  <producto>\n';
      xmlContent += `    <id>${producto.Id}</id>\n`;
      xmlContent += `    <nombre>${producto.Nombre}</nombre>\n`;
      xmlContent += `    <cantidad>${producto.StockDisponible}</cantidad>\n`;
      xmlContent += `    <precio>${producto.Precio}</precio>\n`;
      xmlContent += `    <imagen>${producto.ImagenPrincipal}</imagen>\n`;
      xmlContent += '  </producto>\n';
    });

    xmlContent += '</inventario>';

    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'inventario.xml';
    link.click();
  }

 generarYDescargarExcel(): void {
  const datosExcel = this.productos.map(prod => ({
    ID: prod.Id,
    Nombre: prod.Nombre,
    Cantidad: prod.StockDisponible,
    Precio: prod.Precio,
    // No incluir imagen base64 aquí
    // Puedes poner una URL si la tienes, o dejarlo vacío
    Imagen: prod.ImagenPrincipal ? 'Imagen en base64 no incluida' : ''
  }));

  const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(datosExcel);
  const wb: XLSX.WorkBook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Inventario');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'inventario.xlsx';
  a.click();
  window.URL.revokeObjectURL(url);
}


  // Manejar la carga de imágenes
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.nuevoProducto.ImagenPrincipal = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  irAlCatalogo(){
    this.router.navigate(['/']); // Navegar a la ruta principal (catálogo)
  }
}

