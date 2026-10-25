import { supabase } from './supabaseClient';
import { getJakartaDateString } from '../utils/formatters';

// Mapper Product: DB <-> React
const mapProdFromDb = (row) => ({
  id: row.id,
  name: row.name,
  price: Number(row.price) || 0,
  stock: Number(row.stock) || 0,
  minStock: Number(row.min_stock) ?? 3
});

const mapProdToDb = (p) => ({
  id: p.id,
  name: p.name,
  price: Number(p.price) || 0,
  stock: Number(p.stock) || 0,
  min_stock: Number(p.minStock) ?? 3
});

// Mapper Order: DB <-> React
const mapOrderFromDb = (row) => ({
  id: row.id,
  date: row.date,
  createdAt: row.created_at,
  buyer: row.buyer,
  phone: row.phone || '',
  items: Array.isArray(row.items) ? row.items : [],
  subtotal: Number(row.subtotal) || 0,
  discountType: row.discount_type || 'nominal',
  discountValue: Number(row.discount_value) || 0,
  discountAmount: Number(row.discount_amount) || 0,
  shipping: Number(row.shipping) || 0,
  total: Number(row.total) || 0,
  paymentMethod: row.payment_method || 'QRIS',
  deliveryMethod: row.delivery_method || 'Gojek / Grab Instan',
  orderStatus: row.order_status || 'Baru',
  payStatus: row.pay_status || 'Belum bayar',
  dpAmount: Number(row.dp_amount) || 0,
  note: row.note || '',
  stockDeducted: Boolean(row.stock_deducted)
});

const mapOrderToDb = (o) => ({
  id: o.id,
  date: o.date,
  buyer: o.buyer,
  phone: o.phone || '',
  items: o.items || [],
  subtotal: Number(o.subtotal) || 0,
  discount_type: o.discountType || 'nominal',
  discount_value: Number(o.discountValue) || 0,
  discount_amount: Number(o.discountAmount) || 0,
  shipping: Number(o.shipping) || 0,
  total: Number(o.total) || 0,
  payment_method: o.paymentMethod || 'QRIS',
  delivery_method: o.deliveryMethod || 'Gojek / Grab Instan',
  order_status: o.orderStatus || 'Baru',
  pay_status: o.payStatus || 'Belum bayar',
  dp_amount: Number(o.dpAmount) || 0,
  note: o.note || '',
  stock_deducted: Boolean(o.stockDeducted)
});

export const storageService = {
  async fetchAllData() {
    const [prodRes, ordRes] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: true }),
      supabase.from('orders').select('*').order('created_at', { ascending: false })
    ]);

    return {
      products: (prodRes.data || []).map(mapProdFromDb),
      orders: (ordRes.data || []).map(mapOrderFromDb)
    };
  },

  async upsertProducts(productsArray) {
    if (!productsArray.length) return;
    const rows = productsArray.map(mapProdToDb);
    await supabase.from('products').upsert(rows);
  },

  async deleteProductById(id) {
    await supabase.from('products').delete().eq('id', id);
  },

  async upsertOrder(orderObj) {
    await supabase.from('orders').upsert(mapOrderToDb(orderObj));
  },

  async deleteOrderById(id) {
    await supabase.from('orders').delete().eq('id', id);
  },

  async replaceAllCloudData(productsArray, ordersArray) {
    // Hapus data lama lalu masukkan data baru (untuk fitur Restore JSON / Data Contoh)
    await supabase.from('orders').delete().neq('id', '_none_');
    await supabase.from('products').delete().neq('id', '_none_');

    if (productsArray.length > 0) {
      await supabase.from('products').insert(productsArray.map(mapProdToDb));
    }
    if (ordersArray.length > 0) {
      await supabase.from('orders').insert(ordersArray.map(mapOrderToDb));
    }
  },

  getSampleData() {
    const today = getJakartaDateString();
    return {
      products: [
        { id: 'p1', name: 'Ayam Geprek Sambal Korek', price: 22000, stock: 18, minStock: 5 },
        { id: 'p2', name: 'Dimsum Mentai Isi 6 Pcs', price: 28000, stock: 3, minStock: 4 },
        { id: 'p3', name: 'Es Kopi Susu Gula Aren 250ml', price: 18000, stock: 12, minStock: 3 },
        { id: 'p4', name: 'Paket Hampers Snack Box', price: 85000, stock: 2, minStock: 3 }
      ],
      orders: [
        {
          id: 'ord_sample_1',
          date: today,
          buyer: 'Kak Nadya (WA)',
          phone: '081234567890',
          items: [
            { productId: 'p1', name: 'Ayam Geprek Sambal Korek', price: 22000, qty: 2 },
            { productId: 'p3', name: 'Es Kopi Susu Gula Aren 250ml', price: 18000, qty: 2 }
          ],
          subtotal: 80000,
          discountType: 'percent',
          discountValue: 10,
          discountAmount: 8000,
          shipping: 12000,
          total: 84000,
          paymentMethod: 'QRIS',
          deliveryMethod: 'Gojek / Grab Instan',
          orderStatus: 'Dikemas',
          payStatus: 'DP',
          dpAmount: 40000,
          note: 'Sambal dipisah, titik jemput sesuai map',
          stockDeducted: true
        }
      ]
    };
  }
};
