import { Component, OnInit } from '@angular/core';
import { VentaService } from '../../services/venta.service';

@Component({
  selector: 'app-ventas',
  templateUrl: './ventas.page.html',
  styleUrls: ['./ventas.page.scss'],
})
export class VentasPage implements OnInit {
  ventas: any[] = [];

  constructor(private ventaService: VentaService) {}

  ngOnInit() {
    this.loadVentas();
  }

  loadVentas() {
    this.ventaService.getVentas().subscribe(
      (data) => {
        this.ventas = data;
      },
      (error) => {
        console.error('Error fetching sales:', error);
      }
    );
  }
}
