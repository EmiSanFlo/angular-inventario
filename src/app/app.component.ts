import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { UsuarioComponent } from './components/usuario/usuario.component';
import { ProductoComponent } from './components/producto/producto.component';

@Component({
  selector: 'app-root',
  standalone:true,
  imports: [ProductoComponent, RouterModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  productos: any[] = [];

  constructor(private router: Router) {}

  ngOnInit() {
  if (typeof window !== 'undefined' && window.localStorage) {
    const usuario = localStorage.getItem('usuario');
    this.sesionIniciada = !!usuario;
  } else {
    this.sesionIniciada = false;
  }
  fetch('http://localhost:3000/producto')
    .then(response => response.json())
    .then(data => {
      this.productos = data;
    })
    .catch(error => {
      console.error('Error al obtener productos:', error);
    });
}

  //esta parte es para las sesiones
  sesionIniciada = false;
  fotoPerfil = 'assets/icono_default.png'; // Cambia por la URL real cuando haya sesión

  iniciarSesion() {
    this.router.navigate(['/usuario']);
  }

  menuAbierto = false;

toggleMenu() {
  this.menuAbierto = !this.menuAbierto;
}

cerrarSesion() {
  localStorage.removeItem('usuario');
  this.sesionIniciada = false;
  this.menuAbierto = false;
  this.router.navigate(['/producto']);
}

  abrirPerfil() {
    // Lógica para abrir el perfil o menú de usuario
  }
}