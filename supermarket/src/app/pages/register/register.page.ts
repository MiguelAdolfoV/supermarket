import { Component } from '@angular/core';
import { Router } from '@angular/router';
import axios, { AxiosError } from 'axios';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage {
  nombre: string = '';
  tipo_documento: string = '';
  num_documento: string = '';
  direccion: string = '';
  telefono: string = '';
  email: string = '';
  password: string = '';

  constructor(private router: Router) {}

  async register() {
    // Validar que todos los campos estén llenos
    if (
      !this.nombre.trim() ||
      !this.tipo_documento.trim() ||
      !this.num_documento.trim() ||
      !this.direccion.trim() ||
      !this.telefono.trim() ||
      !this.email.trim() ||
      !this.password.trim()
    ) {
      alert('Todos los campos son obligatorios. Por favor, complete todos los campos.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:3000/register', {
        nombre: this.nombre,
        tipo_documento: this.tipo_documento,
        num_documento: this.num_documento,
        direccion: this.direccion,
        telefono: this.telefono,
        email: this.email,
        password: this.password,
      });
      console.log('Registro exitoso:', response.data);
      alert(`Registro exitoso: ${response.data}`);
      
      // Redirigir a la pantalla de login
      this.router.navigate(['/login']);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Manejar errores específicos de Axios
        console.error('Error en el registro:', error.response?.data || error.message);
        alert(`Error en el registro: ${error.response?.data || error.message}`);
      } else {
        // Manejar cualquier otro tipo de error
        console.error('Error inesperado:', error);
        alert(`Error en el registro: ${error}`);
      }
    }
  }
}
