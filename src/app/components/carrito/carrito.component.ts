import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarritoService } from '../../services/carrito.service';
import { Producto } from '../../models/producto';

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
      this.carrito=this.carritoService.obtenerCarrito();
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
