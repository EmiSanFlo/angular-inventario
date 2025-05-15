import { Component, OnInit } from '@angular/core';
import { ProductosService } from './servicios/productos.service';
import { RouterModule } from '@angular/router';
import { ProductoComponent } from './components/producto/producto.component';

@Component({
  selector: 'app-root',
  standalone:true,
  imports: [ProductoComponent, RouterModule],
  template: '<router-outlet></router-outlet>',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {
  productos: any[] = [];

  ngOnInit() {
    fetch('http://localhost:3000/productos')
      .then(response => response.json())
      .then(data => {
        this.productos = data;
      })
      .catch(error => {
        console.error('Error al obtener productos:', error);
      });
  }
}