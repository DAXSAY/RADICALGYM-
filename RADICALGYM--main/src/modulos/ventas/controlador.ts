import type { ContextoModulo } from '../../nucleo/contexto/tipos';
import { idTemporal } from '../../nucleo/contexto/tipos';
import type { CartItem, PaymentMethod, Product, Transaction } from '../../nucleo/tipos/gym';
import { hoyISO } from '../../nucleo/utilidades/mapeo';
import { servicioVentas } from './servicio';

export function accionesVentas(c: ContextoModulo) {
  const addProduct = (datos: Omit<Product, 'id'>) => {
    c.actualizar('products', prev => [...prev, { ...datos, id: idTemporal('prod') }]);
    c.persistir(() => servicioVentas.crearProducto(datos), `Producto ${datos.name} agregado`);
  };

  const updateProduct = (id: string, datos: Partial<Product>) => {
    const actual = c.d.products.find(p => p.id === id);
    if (!actual) return;
    const nuevo = { ...actual, ...datos };
    c.actualizar('products', prev => prev.map(p => (p.id === id ? nuevo : p)));
    c.persistir(() => servicioVentas.actualizarProducto(nuevo), 'Producto actualizado');
  };

  const deleteProduct = (id: string) => {
    c.actualizar('products', prev => prev.filter(p => p.id !== id));
    c.persistir(() => servicioVentas.eliminarProducto(id), 'Producto retirado');
  };

  const updateStock = (productId: string, newStock: number) => {
    c.actualizar('products', prev => prev.map(p => (p.id === productId ? { ...p, stock: Math.max(0, newStock) } : p)));
    c.persistir(() => servicioVentas.ajustarStock(productId, newStock));
  };

  /** La venta se registra en la API (procedimiento + triggers de stock y caja); la pantalla recibe el ticket al instante. */
  const processPOSSale = (cart: CartItem[], paymentMethod: PaymentMethod, memberId?: string, customerName?: string): Transaction => {
    const total = cart.reduce((s, i) => s + i.product.salePrice * i.quantity, 0);
    const member = memberId ? c.d.members.find(m => m.id === memberId) : undefined;
    const cliente = member ? member.fullName : customerName || 'Cliente General';
    const tx: Transaction = {
      id: idTemporal('tx'), type: 'income', category: 'pos_sale', amount: total, date: hoyISO(), paymentMethod,
      description: `Venta POS Tienda (${cart.length} productos) - ${cliente}`, relatedMemberId: member?.id, relatedMemberName: cliente,
      items: cart.map(i => ({ productId: i.product.id, productName: i.product.name, quantity: i.quantity, unitPrice: i.product.salePrice, total: i.product.salePrice * i.quantity })),
      receiptNumber: 'B001-…',
    };
    c.actualizar('products', prev => prev.map(p => {
      const item = cart.find(i => i.product.id === p.id);
      return item ? { ...p, stock: Math.max(0, p.stock - item.quantity) } : p;
    }));
    c.actualizar('transactions', prev => [tx, ...prev]);
    c.persistir(() => servicioVentas.vender(cart, paymentMethod, member?.id), 'Venta registrada');
    return tx;
  };

  return { addProduct, updateProduct, deleteProduct, updateStock, processPOSSale };
}
