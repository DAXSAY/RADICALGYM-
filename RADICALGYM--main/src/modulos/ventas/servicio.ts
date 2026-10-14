import { api } from '../../nucleo/api/clienteHttp';
import type { CartItem, PaymentMethod, Product } from '../../nucleo/tipos/gym';
import { Fila, idNum, num, opc, txt } from '../../nucleo/utilidades/mapeo';

export function adaptarProducto(p: Fila): Product {
  return {
    id: String(p.idproducto),
    name: txt(p.nombre),
    category: p.categoria,
    brand: txt(p.marca),
    purchaseCost: num(p.precio_compra),
    salePrice: num(p.precio_venta),
    stock: num(p.stock),
    minStockAlert: num(p.stock_minimo),
    image: opc(p.imagen_url),
    barcode: opc(p.codigo_barras),
    description: txt(p.descripcion),
  };
}

const haciaApi = (p: Partial<Product>) => ({
  nombre: p.name,
  categoria: p.category,
  marca: p.brand,
  precio_compra: p.purchaseCost,
  precio_venta: p.salePrice,
  stock: p.stock,
  stock_minimo: p.minStockAlert,
  codigo_barras: p.barcode,
  descripcion: p.description,
  imagen: p.image && /^https?:/.test(p.image) ? p.image : undefined,
});

export const servicioVentas = {
  crearProducto: (p: Omit<Product, 'id'>) => api.post<{ idproducto: number }>('/productos', haciaApi(p)),
  actualizarProducto: (p: Product) => api.put(`/productos/${p.id}`, haciaApi(p)),
  eliminarProducto: (id: string) => api.delete(`/productos/${id}`),
  ajustarStock: (id: string, stock: number) => api.put(`/productos/${id}/stock`, { stock }),
  /** Imagen en la carpeta de productos con nombre {idproducto}_productos_{nombre}.ext */
  subirImagen: (id: string, archivo: File) => api.subir(`/productos/${id}/imagen`, archivo),
  vender: (carrito: CartItem[], metodo: PaymentMethod, memberId?: string) =>
    api.post('/ventas', {
      metodo_pago: metodo,
      idalumno: idNum(memberId) || undefined,
      items: carrito.map(i => ({ idproducto: idNum(i.product.id), cantidad: i.quantity })),
    }),
};
