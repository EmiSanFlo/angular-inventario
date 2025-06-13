import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';


@Component({
  selector: 'app-usuario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuario.component.html',
  styleUrls: ['./usuario.component.css']
})
export class UsuarioComponent {
  mostrarRegistro = false;

    constructor(private router: Router) {}


  loginData = {
    nombreUsuario: '',
    contrasena: ''
  };

  registroData = {
    nombreUsuario: '',
    contrasena: '',
    nombre: '',
    apellido: '',
    email: ''
  };

  login() {
  fetch('http://localhost:3000/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      NombreUsuario: this.loginData.nombreUsuario,
      Contrasena: this.loginData.contrasena
    })
  })
  .then(async res => {
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
      localStorage.setItem('usuarioId', data.usuario.id); // <--- ESTA LÍNEA ES LA QUE FALTA

      // Recarga la página para que AppComponent detecte la sesión
      window.location.href = '/producto';
    } else {
      const msg = await res.text();
      alert('Error: ' + msg);
    }
  })
  .catch(() => alert('Error de conexión con el servidor'));
}

  registrarUsuario() {
  fetch('http://localhost:3000/usuarios', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      NombreUsuario: this.registroData.nombreUsuario,
      Contrasena: this.registroData.contrasena,
      Nombre: this.registroData.nombre,
      Apellido: this.registroData.apellido,
      Email: this.registroData.email
    })
  })
  .then(async res => {
    if (res.ok) {
      alert('¡Usuario registrado!');
      this.mostrarRegistro = false;
    } else {
      const msg = await res.text();
      alert('Error: ' + msg);
    }
  })
  .catch(() => alert('Error de conexión con el servidor'));
}

mostrarRecuperacion = false;

emailRecuperacion = '';
codigoIngresado = '';
nuevaContrasena = '';

codigoEnviado = false;
codigoVerificado = false;

enviarCodigo() {
  fetch('http://localhost:3000/recuperar-contrasena', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: this.emailRecuperacion })
  })
  .then(async res => {
    if (res.ok) {
      alert('Código enviado a tu correo');
      this.codigoEnviado = true;
    } else {
      const msg = await res.text();
      alert('Error: ' + msg);
    }
  })
  .catch(() => alert('Error de conexión con el servidor'));
}

verificarCodigo() {
  fetch('http://localhost:3000/verificar-codigo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      email: this.emailRecuperacion, 
      codigo: this.codigoIngresado,
      nuevaContrasena: this.nuevaContrasena
    })
  })
  .then(async res => {
    if (res.ok) {
      alert('Contraseña cambiada con éxito');
      this.codigoVerificado = true;
    } else {
      const msg = await res.text();
      alert('Error: ' + msg);
    }
  })
  .catch(() => alert('Error de conexión con el servidor'));
}

resetearFormularios() {
  this.mostrarRecuperacion = false;
  this.mostrarRegistro = false;

  this.emailRecuperacion = '';
  this.codigoIngresado = '';
  this.nuevaContrasena = '';

  this.codigoEnviado = false;
  this.codigoVerificado = false;
}

}