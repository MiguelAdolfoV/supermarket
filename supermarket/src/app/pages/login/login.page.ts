import { Component } from '@angular/core';
import { Router } from '@angular/router';
import axios from 'axios';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  email: string = '';
  password: string = '';
  user: any = null;

  constructor(private router: Router) {}

  async login() {
    try {
      const response = await axios.post('http://localhost:3000/login', {
        email: this.email,
        password: this.password,
      });
      console.log('Login exitoso:', response.data);
      this.user = response.data.user;
      alert(`Bienvenido ${this.user.nombre}, tu rol es ${this.user.rol}`);
      
      // Redirigir a la pantalla de home
      this.router.navigate(['/']);
    } catch (error) {
      // Verificar si el error tiene una respuesta de Axios
      if (axios.isAxiosError(error)) {
        console.error('Error en login:', error.response?.data || error.message);
        alert('Error en el login: ' + (error.response?.data || error.message));
      } else {
        console.error('Error inesperado:', error);
        alert('Ocurrió un error inesperado');
      }
    }
  }
}
