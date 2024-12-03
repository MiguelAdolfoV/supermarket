import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Importar los componentes de los modales
import { ProveedoresComponent } from './components/modals/proveedores/proveedores.component';
import { ProductosComponent } from './components/modals/productos/productos.component';

// Importar FormsModule para el uso de [(ngModel)]
import { FormsModule } from '@angular/forms';

import { HttpClientModule } from '@angular/common/http'; // Importa HttpClientModule

import axios from 'axios';

axios.defaults.baseURL = 'http://localhost:3000'; // URL base del backend
axios.defaults.withCredentials = true; // Habilitar el envío de cookies

@NgModule({
  declarations: [
    AppComponent,
    ProveedoresComponent, // Declarar el componente de proveedores
    ProductosComponent, // Declarar el componente de productos
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    FormsModule, // Importar FormsModule para ngModel
    HttpClientModule, // Asegúrate de que esté aquí
  ],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
  bootstrap: [AppComponent],
})
export class AppModule {}
