import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarritoService } from '../../services/carrito.service';
import { Producto } from '../../models/producto';

declare const paypal: any;
@Component({
  selector: 'app-carrito',
  standalone:true,
  imports: [CommonModule],
  templateUrl: './carrito.component.html',
  styleUrl: './carrito.component.css'
})

export class CarritoComponent implements OnInit{
carrito: { producto: Producto, cantidadEnCarrito: number }[] = [];

  constructor(private carritoService : CarritoService){}
    ngOnInit(){
      this.carrito = this.carritoService.obtenerCarrito();
      console.log(this.carrito); // Verifica si hay productos en el carrito

      this.loadPayPalScript().then(() => {
      this.initPayPalButton();
      }).catch(err => {
      console.error('Error al cargar el SDK de PayPal:', err);
      });
    }

    loadPayPalScript(): Promise<void> {
      return new Promise((resolve, reject) => {
        if ((window as any).paypal) {
          resolve(); // Si PayPal ya está cargado, no lo cargues de nuevo
          return;
        }
        const script = document.createElement('script');
        //en client-id pegar el id que les sale en paypal developers. Se meten a dashboard y donde dice credenciales
        //en carrito.component.html tambien cambien el client-id
script.src = 'https://www.paypal.com/sdk/js?client-id=AeKqkTVpxSw01eWL5FTML5F3WLj9X45Pr0WINWqxxC-9uALPkl67r1xUQgga31y7-S_-HOA0Gj7vFFX3&currency=MXN';        script.onload = () => resolve();
        script.onerror = () => reject('No se pudo cargar el SDK de PayPal');
        document.body.appendChild(script);
      });
    }

    getTotal(): number {
  return this.carritoService.calcularSubtotal();
}
  
    initPayPalButton(): void {
      paypal.Buttons({
        createOrder: (data: any, actions: any) => {
          return actions.order.create({
            purchase_units: [{
              amount: {
                value: this.getTotal().toFixed(2) // Total del carrito
              }
            }]
          });
        },
        onApprove: (data: any, actions: any) => {
  return actions.order.capture().then((details: any) => {
    alert(`Pago completado por ${details.payer.name.given_name}`);

    // Prepara arreglo con id y cantidad vendida
    const ventas = this.carrito.map(item => ({
      id: item.producto.Id,
      cantidadVendida: item.cantidadEnCarrito
    }));

    fetch('http://localhost:3000/productos/actualizar-stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ventas)
    })
    .then(res => {
      if (!res.ok) throw new Error('Error al actualizar stock');
      return res.text();
    })
    .then(msg => {
      console.log(msg);
      this.generarXML(); // Generar recibo
      this.carrito = []; // Vaciar carrito
    })
    .catch(err => alert(err.message));
  });
},
        onError: (err: any) => {
          console.error('Error en el pago:', err);
        }
      }).render('#paypal-button-container');
    }

    eliminarProducto(index: number) {
  const item = this.carrito[index];
  this.carritoService.eliminarUnidad(item.producto.Id);
}
    

    generarXML(): void{
      this.carritoService.generarXML();
      const blob = new Blob([this.carritoService.xml], {type: 'text/xml'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download ='carrito.xml';
      document.body.appendChild(a);
      URL.revokeObjectURL(url);
    }
  
    agregarOtro(index: number) {
  const item = this.carrito[index];
  this.carritoService.agregarProducto(item.producto);
}
}
