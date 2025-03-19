import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Producto } from '../models/producto';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {

  private productos : Producto[] = [
    
  ];
  
  private productosSubject = new BehaviorSubject<Producto[]>(this.productos);
  productos$ = this.productosSubject.asObservable(); // Observable para suscribirse


  cargarCatalogoDesdeXML(xmlContent: string): void {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'application/xml');
    const productosXML = xmlDoc.getElementsByTagName('producto');

    this.productos = [];
    for (let i = 0; i < productosXML.length; i++) {
      const productoXML = productosXML[i];
      const producto: Producto = {
        id: +productoXML.getElementsByTagName('id')[0].textContent!,
        nombre: productoXML.getElementsByTagName('nombre')[0].textContent!,
        cantidad: +productoXML.getElementsByTagName('cantidad')[0].textContent!,
        precio: +productoXML.getElementsByTagName('precio')[0].textContent!,
        imagen: productoXML.getElementsByTagName('imagen')[0].textContent!,
      };
      this.productos.push(producto);
    }
  }


  obtenerProductos(): Producto[]{
    return this.productos;
  }

  agregarProducto(producto: Producto): void {
    this.productos.push(producto);
    this.productosSubject.next([...this.productos]); // Notificar el cambio
  }

  modificarProducto(id: number, nuevoProducto: Producto): void {
    const index = this.productos.findIndex((p) => p.id === id);
    if (index !== -1) {
      this.productos[index] = { ...this.productos[index], ...nuevoProducto };
      this.productosSubject.next([...this.productos]); // Notificar el cambio
    }
  }

  eliminarProducto(id: number): void {
    this.productos = this.productos.filter((p) => p.id !== id);
    this.productosSubject.next([...this.productos]); // Notificar el cambio
  }

  generarXML(): string {
    let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xmlContent += '<inventario>\n';
  
    this.productos.forEach((producto) => {
      xmlContent += '  <producto>\n';
      xmlContent += `    <id>${producto.id}</id>\n`;
      xmlContent += `    <nombre>${producto.nombre}</nombre>\n`;
      xmlContent += `    <cantidad>${producto.cantidad}</cantidad>\n`;
      xmlContent += `    <precio>${producto.precio}</precio>\n`;
      xmlContent += `    <imagen>${producto.imagen}</imagen>\n`;
      xmlContent += '  </producto>\n';
    });
  
    xmlContent += '</inventario>';
    return xmlContent;
  }
}
