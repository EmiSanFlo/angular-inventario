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
        Id: +productoXML.getElementsByTagName('id')[0].textContent!,
        Nombre: productoXML.getElementsByTagName('nombre')[0].textContent!,
        StockDisponible: +productoXML.getElementsByTagName('cantidad')[0].textContent!,
        Precio: +productoXML.getElementsByTagName('precio')[0].textContent!,
        ImagenPrincipal: productoXML.getElementsByTagName('imagen')[0].textContent!,
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
    const index = this.productos.findIndex((p) => p.Id === id);
    if (index !== -1) {
      this.productos[index] = { ...this.productos[index], ...nuevoProducto };
      this.productosSubject.next([...this.productos]); // Notificar el cambio
    }
  }

  eliminarProducto(id: number): void {
    this.productos = this.productos.filter((p) => p.Id !== id);
    this.productosSubject.next([...this.productos]); // Notificar el cambio
  }

  generarXML(): string {
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
    return xmlContent;
  }
  
}
