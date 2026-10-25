import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { storageService } from '../services/storageService';
import { getJakartaDateString, calculateOrderPricing } from '../utils/formatters';

const StoreContext = createContext();

export function StoreProvider({ children }) {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('order');
  const [toastMsg, setToastMsg] = useState('');
  const [invoiceOrder, setInvoiceOrder] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2800);
  };

  // Pantau status login admin
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Ambil data dari Supabase setiap kali admin berhasil login
  useEffect(() => {
    if (session) {
      setDataLoading(true);
      storageService.fetchAllData().then(({ products, orders }) => {
        setProducts(products);
        setOrders(orders);
        setDataLoading(false);
      });
    } else {
      setProducts([]);
      setOrders([]);
    }
  }, [session]);

  const signOutAdmin = async () => {
    await supabase.auth.signOut();
    showToast('Berhasil keluar dari akun admin');
  };

  // --- AKSI PRODUK & STOK ---
  const saveProduct = async (prodData) => {
    const targetProd = prodData.id
      ? { ...prodData }
      : { ...prodData, id: 'prd_' + Date.now() + Math.random().toString(36).slice(2, 6) };

    const updatedProducts = prodData.id
      ? products.map((p) => (p.id === prodData.id ? targetProd : p))
      : [...products, targetProd];

    setProducts(updatedProducts);
    await storageService.upsertProducts([targetProd]);
    showToast(prodData.id ? 'Produk diperbarui!' : 'Produk ditambahkan!');
  };

  const adjustStock = async (productId, delta) => {
    const target = products.find((p) => p.id === productId);
    if (!target) return;
    const updatedProd = { ...target, stock: Number(target.stock) + delta };
    setProducts(products.map((p) => (p.id === productId ? updatedProd : p)));
    await storageService.upsertProducts([updatedProd]);
  };

  const deleteProduct = async (productId) => {
    setProducts(products.filter((p) => p.id !== productId));
    await storageService.deleteProductById(productId);
    showToast('Produk dihapus');
  };

  // --- AKSI ORDER ---
  const createOrder = async (orderPayload) => {
    const pricing = calculateOrderPricing(
      orderPayload.items,
      orderPayload.discountType,
      orderPayload.discountValue,
      orderPayload.shipping
    );

    const changedProducts = [];
    const updatedProducts = products.map((p) => {
      const boughtItem = orderPayload.items.find((it) => it.productId === p.id);
      if (boughtItem) {
        const nextProd = { ...p, stock: Number(p.stock) - Number(boughtItem.qty) };
        changedProducts.push(nextProd);
        return nextProd;
      }
      return p;
    });

    const newOrder = {
      id: 'ord_' + Date.now(),
      date: getJakartaDateString(),
      createdAt: new Date().toISOString(),
      buyer: orderPayload.buyer,
      phone: orderPayload.phone,
      items: orderPayload.items,
      subtotal: pricing.subtotal,
      discountType: pricing.discountType,
      discountValue: pricing.discountValue,
      discountAmount: pricing.discountAmount,
      shipping: pricing.shipping,
      total: pricing.grandTotal,
      paymentMethod: orderPayload.paymentMethod,
      deliveryMethod: orderPayload.deliveryMethod,
      orderStatus: 'Baru',
      payStatus: orderPayload.payStatus,
      dpAmount: orderPayload.payStatus === 'DP' ? Number(orderPayload.dpAmount) || 0 : 0,
      note: orderPayload.note,
      stockDeducted: true
    };

    setProducts(updatedProducts);
    setOrders([newOrder, ...orders]);

    await Promise.all([
      storageService.upsertOrder(newOrder),
      storageService.upsertProducts(changedProducts)
    ]);
    showToast('Order disimpan ke Cloud & stok dikurangi!');
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder || targetOrder.orderStatus === newStatus) return;

    let updatedProducts = [...products];
    const changedProducts = [];
    let stockDeducted = targetOrder.stockDeducted;

    if (newStatus === 'Batal' && stockDeducted) {
      updatedProducts = products.map((p) => {
        const item = targetOrder.items.find((it) => it.productId === p.id);
        if (item) {
          const nextProd = { ...p, stock: Number(p.stock) + Number(item.qty) };
          changedProducts.push(nextProd);
          return nextProd;
        }
        return p;
      });
      stockDeducted = false;
      showToast('Order dibatalkan & stok dikembalikan!');
    } else if (targetOrder.orderStatus === 'Batal' && newStatus !== 'Batal' && !stockDeducted) {
      updatedProducts = products.map((p) => {
        const item = targetOrder.items.find((it) => it.productId === p.id);
        if (item) {
          const nextProd = { ...p, stock: Number(p.stock) - Number(item.qty) };
          changedProducts.push(nextProd);
          return nextProd;
        }
        return p;
      });
      stockDeducted = true;
      showToast('Order aktif kembali & stok dipotong!');
    } else {
      showToast(`Status order: ${newStatus}`);
    }

    const updatedOrder = { ...targetOrder, orderStatus: newStatus, stockDeducted };
    setProducts(updatedProducts);
    setOrders(orders.map((o) => (o.id === orderId ? updatedOrder : o)));

    await Promise.all([
      storageService.upsertOrder(updatedOrder),
      storageService.upsertProducts(changedProducts)
    ]);
  };

  const updatePayStatus = async (orderId, newPayStatus, dpAmountInput = 0) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;
    const updatedOrder = {
      ...targetOrder,
      payStatus: newPayStatus,
      dpAmount: newPayStatus === 'DP' ? Math.max(0, Number(dpAmountInput) || 0) : 0
    };
    setOrders(orders.map((o) => (o.id === orderId ? updatedOrder : o)));
    await storageService.upsertOrder(updatedOrder);
    showToast(`Status bayar: ${newPayStatus}`);
  };

  const updatePaymentMethod = async (orderId, newMethod) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;
    const updatedOrder = { ...targetOrder, paymentMethod: newMethod };
    setOrders(orders.map((o) => (o.id === orderId ? updatedOrder : o)));
    await storageService.upsertOrder(updatedOrder);
    showToast(`Metode bayar: ${newMethod}`);
  };

  const deleteOrder = async (orderId) => {
    const target = orders.find((o) => o.id === orderId);
    if (!target) return;

    const changedProducts = [];
    let updatedProducts = [...products];
    if (target.stockDeducted) {
      updatedProducts = products.map((p) => {
        const item = target.items.find((it) => it.productId === p.id);
        if (item) {
          const nextProd = { ...p, stock: Number(p.stock) + Number(item.qty) };
          changedProducts.push(nextProd);
          return nextProd;
        }
        return p;
      });
    }

    setProducts(updatedProducts);
    setOrders(orders.filter((o) => o.id !== orderId));

    await Promise.all([
      storageService.deleteOrderById(orderId),
      storageService.upsertProducts(changedProducts)
    ]);
    showToast('Order dihapus');
  };

  const loadSample = async () => {
    const sample = storageService.getSampleData();
    setProducts(sample.products);
    setOrders(sample.orders);
    await storageService.replaceAllCloudData(sample.products, sample.orders);
    showToast('Data contoh dimuat ke Cloud!');
  };

  const clearAll = async () => {
    setProducts([]);
    setOrders([]);
    await storageService.replaceAllCloudData([], []);
    showToast('Semua data dihapus bersih');
  };

  const restoreFromJson = async (parsedData) => {
    setProducts(parsedData.products);
    setOrders(parsedData.orders);
    await storageService.replaceAllCloudData(parsedData.products, parsedData.orders);
    showToast('Data backup berhasil dipulihkan ke Cloud!');
  };

  return (
    <StoreContext.Provider
      value={{
        session,
        authLoading,
        dataLoading,
        signOutAdmin,
        products,
        orders,
        activeTab,
        setActiveTab,
        toastMsg,
        showToast,
        invoiceOrder,
        setInvoiceOrder,
        saveProduct,
        adjustStock,
        deleteProduct,
        createOrder,
        updateOrderStatus,
        updatePayStatus,
        updatePaymentMethod,
        deleteOrder,
        loadSample,
        clearAll,
        restoreFromJson
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => useContext(StoreContext);