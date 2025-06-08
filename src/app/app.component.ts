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
  sesionIniciada = false;
  fotoPerfil = 'assets/icono_default.png';
  menuAbierto = false;
  usuarioSesion: any = null; // <-- AGREGA ESTA LÍNEA

  constructor(private router: Router) {}

  ngOnInit() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const usuario = localStorage.getItem('usuario');
      this.sesionIniciada = !!usuario;
      this.usuarioSesion = usuario ? JSON.parse(usuario) : null; // <-- Y ESTA LÍNEA
    } else {
      this.sesionIniciada = false;
      this.usuarioSesion = null;
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


  iniciarSesion() {
    this.router.navigate(['/usuario']);
  }

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