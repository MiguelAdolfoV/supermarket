import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private cart: any[] = [];

  constructor() {}

  // Obtener todos los productos del carrito
  getItems(): any[] {
    return this.cart;
  }

  // Agregar un producto al carrito
  addItem(product: any): void {
    this.cart.push(product); // Agrega el producto directamente al carrito
  }
  
  // Actualizar un producto (aumentar su cantidad)
  updateItem(updatedItem: any): void {
    const index = this.cart.findIndex(item => item.cartId === updatedItem.cartId);
    if (index !== -1) {
      this.cart[index] = updatedItem;
    }
  }
  

  // Eliminar un producto del carrito
  removeItem(cartId: number): void {
    this.cart = this.cart.filter(item => item.cartId !== cartId);
  }
  

  // Vaciar el carrito
  clearCart(): void {
    this.cart = [];
  }

  // Obtener el total del carrito
  getTotal(): number {
    return this.cart.reduce((total, item) => total + item.precio_venta * item.quantity, 0);
  }
}
