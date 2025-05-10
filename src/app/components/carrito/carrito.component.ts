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
  carrito: Producto[] = [];

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
        script.src = 'https://www.paypal.com/sdk/js?client-id=ARbAyq0vx3C2eyiZuvUmTRQZEZutl_-t9HsDjsn87MexI9It4CEQPGLcVcQd_E2aV8b6xbJ8u5e7RIfI&currency=USD';
        script.onload = () => resolve();
        script.onerror = () => reject('No se pudo cargar el SDK de PayPal');
        document.body.appendChild(script);
      });
    }

    getTotal(): number {
      return this.carrito.reduce((total, producto) => total + producto.precio * producto.cantidad, 0);
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
            this.generarXML(); // Generar el recibo XML después del pago
            this.carrito = []; // Vaciar el carrito después del pago
          });
        },
        onError: (err: any) => {
          console.error('Error en el pago:', err);
        }
      }).render('#paypal-button-container');
    }

    eliminarProducto(index: number): void{
      this.carrito[index].cantidad -= 1;
      if(this.carrito[index].cantidad === 0){
        this.carrito.splice(index, 1);
      }
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
      this.carrito[index].cantidad += 1;
    }

    agregarProducto(producto: Producto) {
      const index = this.carrito.findIndex(p => p.nombre === producto.nombre);
      if (index !== -1) {
        this.carrito[index].cantidad += 1;
      } else {
        this.carrito.push({ ...producto, cantidad: 1 });
      }
    }
}
