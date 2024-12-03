import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class VentaService {
  private apiUrl = 'http://localhost:3000/ventas'; // Cambia según la configuración de tu API

  constructor(private http: HttpClient) {}

  getVentas(): Observable<any> {
    return this.http.get(this.apiUrl);
  }
}
