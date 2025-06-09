import { Injectable } from '@angular/core';
import { Producto } from '../models/producto';

@Injectable({
  providedIn: 'root',
})
export class InventarioService {
  private inventario: Producto[] = [];

  constructor() {}

  ccrearProducto(producto: Producto): Promise<any> {
  return fetch('http://localhost:3000/productos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(producto)
  }).then(res => res.json());
}

  modificarProducto(id: number, nuevoProducto: Producto): Promise<any> {
  return fetch(`http://localhost:3000/productos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(nuevoProducto)
  }).then(res => res.json());
}

  eliminarProducto(id: number): void {
    this.inventario = this.inventario.filter((p) => p.Id !== id);
  }

  consultarInventario(): Producto[] {
    return this.inventario;
  }

  generarXML(): string {
    let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xmlContent += '<inventario>\n';

    this.inventario.forEach((producto) => {
      xmlContent += '  <producto>\n';
      xmlContent += `    <id>${producto.Id}</id>\n`;
      xmlContent += `    <nombre>${producto.Nombre}</nombre>\n`;
      xmlContent += `    <cantidad>${producto.StockDisponible}</cantidad>\n`;
      xmlContent += `    <precio>${producto.Precio}</precio>\n`;
      xmlContent += `    <imagen>${producto.ImagenPrincipal}</imagen>\n`; // Incluir la imagen
      xmlContent += '  </producto>\n';
    });

    xmlContent += '</inventario>';
    return xmlContent;
  }
}