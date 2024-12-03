import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import axios from 'axios';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  showNavbar = true; // Estado de visibilidad de la navbar
  hiddenRoutes: string[] = ['/login', '/register']; // Rutas donde no se mostrará la navbar
  isLoggedIn: boolean = false; // Estado de la sesión
  user: any = null; // Datos del usuario

  constructor(private router: Router) {
    this.router.events.subscribe(() => {
      // Comprueba si la ruta actual está en la lista de rutas ocultas
      const currentRoute = this.router.url.split('?')[0]; // Ignora los parámetros de consulta
      this.showNavbar = !this.hiddenRoutes.includes(currentRoute);

      // Verificar la sesión cada vez que se navega
      this.checkSession();
    });
  }

  ngOnInit() {
    this.checkSession(); // Verificar sesión al cargar la app
  }

  async checkSession() {
    try {
      const response = await axios.get('http://localhost:3000/session');
      this.user = response.data.user;
      this.isLoggedIn = true; // Usuario en sesión
      console.log('Usuario en sesión:', this.user); // Depuración
    } catch (error) {
      this.isLoggedIn = false; // No hay usuario en sesión
      this.user = null;
    }
  }

  async logout() {
    try {
      await axios.post('http://localhost:3000/logout');
      alert('Sesión cerrada exitosamente');
      this.isLoggedIn = false; // Actualizar el estado
      this.user = null;
      this.router.navigate(['/']); // Redirigir al login
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      alert('Hubo un problema al cerrar la sesión.');
    }
  }
}
