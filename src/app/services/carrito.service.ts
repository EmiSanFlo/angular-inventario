import { Injectable } from "@angular/core";
import { Producto } from "../models/producto";

interface ItemCarrito {
  producto: Producto;
  cantidadEnCarrito: number;
}

@Injectable({
  providedIn: 'root'
})
export class CarritoService {
  xml: string = '';
  private carrito: ItemCarrito[] = [];
  private readonly IVA_RATE: number = 0.16; // Tasa de IVA del 16%

  agregarProducto(producto: Producto) {
    const item = this.carrito.find(i => i.producto.Id === producto.Id);
    if (item) {
      if (item.cantidadEnCarrito < producto.StockDisponible) {
        item.cantidadEnCarrito++;
      } else {
        alert('No hay más stock disponible');
      }
    } else {
      if (producto.StockDisponible > 0) {
        this.carrito.push({ producto, cantidadEnCarrito: 1 });
      } else {
        alert('Producto agotado');
      }
    }
  }

  eliminarUnidad(productoId: number) {
    const index = this.carrito.findIndex(i => i.producto.Id === productoId);
    if (index !== -1) {
      if (this.carrito[index].cantidadEnCarrito > 1) {
        this.carrito[index].cantidadEnCarrito--;
      } else {
        this.carrito.splice(index, 1);
      }
    }
  }

  obtenerCarrito(): ItemCarrito[] {
    return this.carrito;
  }

  generarXML(): void {
    let xmlContent = '<?xml version="1.0" encoding="UTF-8" ?>\n<factura>\n';

    xmlContent += `  <info>\n    <folio>23</folio>\n    <fecha>${new Date().toISOString().split('T')[0]}</fecha>\n    <cliente>\n      <nombre>Usuario</nombre>\n      <email>usuario@correo.com</email>\n    </cliente>\n  </info>\n`;

    xmlContent += `  <productos>\n`;
    this.carrito.forEach((item) => {
      const subtotal = item.producto.Precio * item.cantidadEnCarrito;
      xmlContent += `    <producto>\n      <id>${item.producto.Id}</id>\n      <descripcion>${item.producto.Nombre}</descripcion>\n      <cantidad>${item.cantidadEnCarrito}</cantidad>\n      <precioUnitario>${item.producto.Precio}</precioUnitario>\n      <subtotal>${subtotal}</subtotal>\n    </producto>\n`;
    });
    xmlContent += `  </productos>\n`;

    const subtotal = this.calcularSubtotal();
    const iva = subtotal * this.IVA_RATE;
    const total = subtotal + iva;
    xmlContent += `  <totales>\n    <subtotal>${subtotal}</subtotal>\n    <iva>${iva}</iva>\n    <total>${total}</total>\n  </totales>\n`;

    xmlContent += '</factura>';

    this.xml = xmlContent;

    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'factura.xml';
    link.click();
  }

  calcularSubtotal(): number {
    return this.carrito.reduce((total, item) => total + (item.producto.Precio * item.cantidadEnCarrito), 0);
  }
}
