import { Component } from '@angular/core';
import { Router } from '@angular/router'; // Importar Router
import { CommonModule } from '@angular/common'; // Importar CommonModule
import { FormsModule } from '@angular/forms';
import { InventarioService } from '../../services/inventario.services'; // Ensure this path is correct
import { Producto } from '../../models/producto';
import { ProductoService } from '../../services/producto.service'; // Usar ProductoService

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

  crearProducto(): void {
    this.inventarioService.crearProducto(this.nuevoProducto);
    this.productoService.agregarProducto(this.nuevoProducto);
    this.actualizarLista();
    this.nuevoProducto = { Id: 0, Nombre: '', StockDisponible: 0, Precio: 0, ImagenPrincipal: '' }; // Reiniciar el formulario
  }

  modificarProducto(id: number): void {
    const producto = this.productos.find((p) => p.Id === id);
    if (producto) {
      const nuevoNombre = prompt('Ingrese el nuevo nombre:', producto.Nombre);
      const nuevaCantidad = prompt('Ingrese la nueva cantidad:', producto.StockDisponible.toString());
      const nuevoPrecio = prompt('Ingrese el nuevo precio:', producto.Precio.toString());

      if (nuevoNombre && nuevaCantidad && nuevoPrecio) {
        const productoModificado: Producto = {
          ...producto,
          Nombre: nuevoNombre,
          StockDisponible: +nuevaCantidad,
          Precio: +nuevoPrecio,
        };
        this.productoService.modificarProducto(id, productoModificado); // Llamar al método del servicio
        this.actualizarLista(); // Actualizar la lista después de modificar
      }
    }
  }

  eliminarProducto(id: number): void {
    this.inventarioService.eliminarProducto(id);
    this.productoService.eliminarProducto(id);
    this.actualizarLista();
  }

  actualizarLista(): void {
    this.productos = this.inventarioService.consultarInventario();
    this.productos = this.productoService.obtenerProductos();
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

  // Manejar la carga de imágenes
  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.nuevoProducto.ImagenPrincipal = reader.result as string; // Guardar la imagen como URL
      };
      reader.readAsDataURL(file);
    }
  }

  irAlCatalogo(){
    this.router.navigate(['/']); // Navegar a la ruta principal (catálogo)
  }
}

