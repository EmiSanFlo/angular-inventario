import { Injectable } from "@angular/core";
import { Producto } from "../models/producto";

@Injectable({
    providedIn: 'root'
})
export class CarritoService {
    xml: string = '';
    private carrito: Producto[] = [];
    private readonly IVA_RATE: number = 0.16; // Tasa de IVA del 16%

    agregarProducto(producto: Producto) {
        this.carrito.push(producto);
    }

    obtenerCarrito(): Producto[] {
        return this.carrito;
    }

    generarXML(): void {
        // Crear el contenido básico del XML
        let xmlContent = '<?xml version="1.0" encoding="UTF-8" ?>\n<factura>\n';

        // Información de la factura
        xmlContent += `  <info>\n    <folio>23</folio>\n    <fecha>${new Date().toISOString().split('T')[0]}</fecha>\n    <cliente>\n      <nombre>Usuario</nombre>\n      <email>usuario@correo.com</email>\n    </cliente>\n  </info>\n`;

        // Productos en el carrito
        xmlContent += `  <productos>\n`;
        this.carrito.forEach((producto) => {
            const subtotal = producto.precio * producto.cantidad;
            xmlContent += `    <producto>\n      <id>${producto.id}</id>\n      <descripcion>${producto.nombre}</descripcion>\n      <cantidad>${producto.cantidad}</cantidad>\n      <precioUnitario>${producto.precio}</precioUnitario>\n      <subtotal>${subtotal}</subtotal>\n    </producto>\n`;
        });
        xmlContent += `  </productos>\n`;

        // Totales (con IVA)
        const subtotal = this.calcularSubtotal();
        const iva = subtotal * this.IVA_RATE;
        const total = subtotal + iva;
        xmlContent += `  <totales>\n    <subtotal>${subtotal}</subtotal>\n    <iva>${iva}</iva>\n    <total>${total}</total>\n  </totales>\n`;

        // Cerrar la etiqueta de <factura>
        xmlContent += '</factura>';

        // Crear un Blob con el contenido XML
        const blob = new Blob([xmlContent], { type: 'application/xml' });

        // Crear un enlace temporal para la descarga
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'factura.xml';  // Nombre del archivo a descargar

        // Disparar el evento de clic para descargar el archivo
        link.click();
    }

    // Método para calcular el subtotal
    calcularSubtotal(): number {
        return this.carrito.reduce((total, producto) => total + (producto.precio * producto.cantidad), 0);
    }
}