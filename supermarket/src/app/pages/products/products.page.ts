import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CatalogService } from '../../services/catalog.service';
import axios from 'axios';
import { jsPDF } from 'jspdf';

@Component({
  selector: 'app-products',
  templateUrl: './products.page.html',
  styleUrls: ['./products.page.scss'],
})
export class ProductsPage implements OnInit {
  products: any[] = [];
  cart: any[] = [];
  categoryId: number;
  isLoggedIn: boolean = false; // Estado de la sesión
  user: any = null; // Datos del usuario
  total: number = 0;

  constructor(private route: ActivatedRoute, private catalogService: CatalogService) {
    this.categoryId = Number(this.route.snapshot.paramMap.get('categoryId'));
    this.checkSession();
  }

  async ngOnInit() {
    this.products = await this.catalogService.getProducts(this.categoryId);
    this.products.forEach(product => {
      product.quantity = 1; // Cantidad inicial
      product.imagePath = this.getImagePath(product.nombre); // Ruta de imagen
    });

    // Cargar carrito desde Local Storage
    this.loadCartFromLocalStorage();
    
    // Inicializar PayPal
    this.initializePayPal();
  }

  getImagePath(productName: string): string {
    // Reemplazar espacios por guiones bajos y agregar la extensión `.jpg`
    const formattedName = productName.replace(/ /g, '_');
    return `/images/${formattedName}.jpg`;
  }

  setDefaultImage(event: any) {
    event.target.src = '/images/default.jpg'; // Cambiar a imagen por defecto
  }

  initializePayPal() {
    const paypal = (window as any).paypal;
    if (!paypal) {
      console.error('PayPal SDK no cargado.');
      return;
    }
  
    // Limpiar el contenedor del botón de PayPal
    const paypalContainer = document.getElementById('paypal-button-container');
    if (paypalContainer) {
      paypalContainer.innerHTML = ''; // Vacía el contenedor
    }
  
    paypal.Buttons({
      createOrder: (data: any, actions: any) => {
        return actions.order.create({
          purchase_units: [
            {
              amount: {
                value: this.total.toFixed(2), // Monto total del carrito
              },
            },
          ],
        });
      },
      onApprove: async (data: any, actions: any) => {
        return actions.order.capture().then(async (details: any) => {
          // Mostrar la notificación del ticket después de que el pago fue aprobado
          this.generateTicket();
  
          // Aquí recorremos el carrito y actualizamos el stock de cada producto
          for (let item of this.cart) {
            this.updateProductStock(item.id, item.quantity);
          }
  
          // Limpiar el carrito después de mostrar el ticket
          this.clearCart(); // Limpia el carrito después de mostrar el ticket
        });
      },
  
      onError: (err: any) => {
        console.error('Error en el proceso de pago:', err);
        alert('Hubo un problema con el pago. Inténtalo de nuevo.');
      },
    }).render('#paypal-button-container');
  }

  // Llamar a la función generar ticket antes de la compra
  generateTicket() {
    const doc = new jsPDF();
    
    // Título del ticket
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text("Ticket de Compra", 105, 20);  // Título centrado
    
    // Dibuja una línea debajo del título
    doc.setLineWidth(0.5);
    doc.line(10, 25, 200, 25);  // Línea horizontal
    
    // Detalles de la tienda
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text("Tienda: SARKENI", 20, 30);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 140, 30);
  
    // Salto de línea para separar el encabezado de la lista de productos
    let yPosition = 40;
    
    // Verificar que el carrito tiene productos
    if (this.cart.length === 0) {
      console.log('Carrito vacío');
      doc.text('No hay productos en el carrito.', 20, yPosition);
    } else {
      // Lista de productos
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      
      this.cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        doc.text(`${item.name} x${item.quantity} - $${itemTotal.toFixed(2)}`, 20, yPosition);
        yPosition += 8; // Espacio entre los productos
      });
  
      // Línea de separación
      doc.setLineWidth(0.3);
      doc.line(10, yPosition + 5, 200, yPosition + 5);
  
      // Mostrar el total
      yPosition += 10;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total: $${this.total.toFixed(2)}`, 20, yPosition);
    }
  
    // Mostrar notificación de descarga
    const userResponse = window.confirm("¿Desea descargar el ticket?");
    
    if (userResponse) {
      doc.save('ticket_compra.pdf'); // Descargar PDF si el usuario acepta
    }
  }
  
  updateProductStock(productId: number, quantitySold: number) {
    axios.put(`http://localhost:3000/products/${productId}`, {
      quantitySold
    })
    .then(response => {
      console.log('Stock actualizado:', response.data);
    })
    .catch(error => {
      console.error('Error actualizando el stock:', error);
    });
  }

  addToCart(product: any) {
    const existingItem = this.cart.find(item => item.id === product.idarticulo);
    if (existingItem) {
      existingItem.quantity += product.quantity;
    } else {
      this.cart.push({
        id: product.idarticulo,
        name: product.nombre,
        price: product.precio_venta,
        quantity: product.quantity,
        cartId: new Date().getTime(), // Identificador único
      });
    }
    this.updateTotal();
    this.saveCartToLocalStorage();
  }
  
  removeItem(cartId: number) {
    this.cart = this.cart.filter(item => item.cartId !== cartId);
    this.updateTotal();
    this.saveCartToLocalStorage();
  }

  clearCart() {
    this.cart = [];
    this.total = 0;
    this.saveCartToLocalStorage();
  }

  updateTotal() {
    this.total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
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

  saveCartToLocalStorage() {
    localStorage.setItem('cart', JSON.stringify(this.cart));
  }

  loadCartFromLocalStorage() {
    const cartData = localStorage.getItem('cart');
    if (cartData) {
      this.cart = JSON.parse(cartData);
      this.updateTotal(); // Asegúrate de recalcular el total al cargar
    }
  }
}
