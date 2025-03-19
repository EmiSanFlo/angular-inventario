import { Injectable } from '@angular/core';
import { Producto } from '../models/producto';

@Injectable({
  providedIn: 'root',
})
export class InventarioService {
  private inventario: Producto[] = [];

  constructor() {}

  crearProducto(producto: Producto): void {
    this.inventario.push(producto);
  }

  modificarProducto(id: number, nuevoProducto: Producto): void {
    const index = this.inventario.findIndex((p) => p.id === id);
    if (index !== -1) {
      this.inventario[index] = { ...this.inventario[index], ...nuevoProducto };
    }
  }

  eliminarProducto(id: number): void {
    this.inventario = this.inventario.filter((p) => p.id !== id);
  }

  consultarInventario(): Producto[] {
    return this.inventario;
  }

  generarXML(): string {
    let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xmlContent += '<inventario>\n';

    this.inventario.forEach((producto) => {
      xmlContent += '  <producto>\n';
      xmlContent += `    <id>${producto.id}</id>\n`;
      xmlContent += `    <nombre>${producto.nombre}</nombre>\n`;
      xmlContent += `    <cantidad>${producto.cantidad}</cantidad>\n`;
      xmlContent += `    <precio>${producto.precio}</precio>\n`;
      xmlContent += `    <imagen>${producto.imagen}</imagen>\n`; // Incluir la imagen
      xmlContent += '  </producto>\n';
    });

    xmlContent += '</inventario>';
    return xmlContent;
  }
}