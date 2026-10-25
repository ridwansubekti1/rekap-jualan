import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Wallet,
  Clock,
  PlusCircle,
  ChevronDown,
  Plus,
  X,
  CheckCircle2,
  Search,
  MessageSquareText,
  Trash2,
  Tag,
  Truck,
  CreditCard
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import {
  getJakartaDateString,
  formatTanggalIndo,
  formatRupiah,
  calculateOrderPricing,
  getUnpaidAmount
} from '../utils/formatters';

const PAYMENT_METHODS = ['Tunai', 'Transfer', 'QRIS'];
const DELIVERY_METHODS = [
  'Gojek / Grab Instan',
  'GoFood / GrabFood / ShopeeFood',
  'Ambil Sendiri',
  'Kurir Sendiri / COD',
  'Ekspedisi Reguler'
];

export default function OrderTab() {
  const {
    products,
    orders,
    createOrder,
    updateOrderStatus,
    updatePayStatus,
    updatePaymentMethod,
    deleteOrder,
    setInvoiceOrder
  } = useStore();

  const today = getJakartaDateString();
  const [isFormOpen, setIsFormOpen] = useState(true);

  // State Form Order
  const [buyer, setBuyer] = useState('');
  const [phone, setPhone] = useState('');
  const [orderItems, setOrderItems] = useState([{ productId: '', qty: 1 }]);
  const [discountType, setDiscountType] = useState('nominal'); // 'nominal' | 'percent'
  const [discountValue, setDiscountValue] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('QRIS');
  const [deliveryMethod, setDeliveryMethod] = useState('Gojek / Grab Instan');
  const [payStatus, setPayStatus] = useState('Belum bayar');
  const [dpAmount, setDpAmount] = useState(0);
  const [note, setNote] = useState('');

  // Format angka menjadi teks bertitik ribuan (contoh: 10000 -> "10.000")
  const formatThousandInput = (val) => {
    const num = Number(String(val).replace(/\D/g, '')) || 0;
    return num === 0 ? '' : num.toLocaleString('id-ID');
  };

  // Ambil angka murni dari ketikan yang ada titiknya (contoh: "10.000" -> 10000)
  const parseThousandInput = (str) => {
    const cleaned = String(str).replace(/\D/g, '');
    return cleaned === '' ? 0 : Number(cleaned);
  };

  // State Filter
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState(today);
  const [filterOrdStatus, setFilterOrdStatus] = useState('ALL');
  const [filterPayStatus, setFilterPayStatus] = useState('ALL');

  // Sinkronisasi default produk pertama saat daftar produk berubah
  useEffect(() => {
    if (products.length > 0 && orderItems.length === 1 && !orderItems[0].productId) {
      setOrderItems([{ productId: products[0].id, qty: 1 }]);
    }
  }, [products]);

  // Hitung rincian harga secara real-time untuk preview di form
  const mappedItemsForCalc = orderItems
    .map((row) => {
      const prod = products.find((p) => p.id === row.productId);
      return prod ? { productId: prod.id, name: prod.name, price: prod.price, qty: Number(row.qty) || 0 } : null;
    })
    .filter((it) => it && it.qty > 0);

  const pricingPreview = calculateOrderPricing(mappedItemsForCalc, discountType, discountValue, shipping);

  const handleAddRow = () => {
    setOrderItems([...orderItems, { productId: products[0]?.id || '', qty: 1 }]);
  };

  const handleRemoveRow = (idx) => {
    if (orderItems.length <= 1) return;
    setOrderItems(orderItems.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx, field, val) => {
    const updated = orderItems.map((item, i) => (i === idx ? { ...item, [field]: val } : item));
    setOrderItems(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (products.length === 0) {
      alert('Tambahkan produk dulu di tab Stok, atau klik tombol Data Contoh di atas.');
      return;
    }

    // Gabungkan item jika produk yang sama dipilih 2 kali
    const mergedMap = new Map();
    mappedItemsForCalc.forEach((it) => {
      if (mergedMap.has(it.productId)) {
        mergedMap.get(it.productId).qty += it.qty;
      } else {
        mergedMap.set(it.productId, { ...it });
      }
    });
    const finalItems = Array.from(mergedMap.values());

    if (finalItems.length === 0) {
      alert('Pilih minimal 1 barang dengan jumlah minimal 1.');
      return;
    }

    // Cek stok kurang
    const overStock = [];
    finalItems.forEach((it) => {
      const p = products.find((x) => x.id === it.productId);
      if (p && it.qty > p.stock) {
        overStock.push(`${p.name} (Order: ${it.qty}, Stok: ${p.stock})`);
      }
    });

    if (overStock.length > 0) {
      const ok = window.confirm(
        `⚠️ PERINGATAN STOK KURANG:\n\n${overStock.join('\n')}\n\nTetap simpan order ini?`
      );
      if (!ok) return;
    }

    createOrder({
      buyer: buyer.trim(),
      phone: phone.trim(),
      items: finalItems,
      discountType,
      discountValue: Number(discountValue) || 0,
      shipping: Number(shipping) || 0,
      paymentMethod,
      deliveryMethod,
      payStatus,
      dpAmount: Number(dpAmount) || 0,
      note: note.trim()
    });

    // Reset form
    setBuyer('');
    setPhone('');
    setOrderItems([{ productId: products[0]?.id || '', qty: 1 }]);
    setDiscountValue(0);
    setShipping(0);
    setPayStatus('Belum bayar');
    setDpAmount(0);
    setNote('');
  };

  // Ringkasan Kartu Atas
  const todayActiveOrders = orders.filter((o) => o.date === today && o.orderStatus !== 'Batal');
  const omzetToday = todayActiveOrders.reduce((s, o) => s + o.total, 0);
  const unpaidOrdersAll = orders.filter((o) => getUnpaidAmount(o) > 0);
  const totalUnpaidAll = unpaidOrdersAll.reduce((s, o) => s + getUnpaidAmount(o), 0);

  // Filter daftar order
  const filteredOrders = orders.filter((o) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchBuyer = o.buyer.toLowerCase().includes(q);
      const matchNote = (o.note || '').toLowerCase().includes(q);
      if (!matchBuyer && !matchNote) return false;
    }
    if (filterDate && o.date !== filterDate) return false;
    if (filterOrdStatus !== 'ALL' && o.orderStatus !== filterOrdStatus) return false;
    if (filterPayStatus === 'BELUM_LUNAS') {
      if (o.payStatus === 'Lunas' || o.orderStatus === 'Batal') return false;
    } else if (filterPayStatus !== 'ALL' && o.payStatus !== filterPayStatus) {
      return false;
    }
    return true;
  });

  const handlePayStatusSelect = (order, newPayStatus) => {
    if (newPayStatus === 'DP') {
      const input = window.prompt('Masukkan nominal DP yang sudah dibayar (Rp):', order.dpAmount || '');
      if (input === null) return;
      const cleanDp = Number(String(input).replace(/\D/g, '')) || 0;
      updatePayStatus(order.id, 'DP', cleanDp);
    } else {
      updatePayStatus(order.id, newPayStatus, 0);
    }
  };

  return (
    <section className="space-y-5">
      {/* 3 Kartu Angka Ringkas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Order Hari Ini</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{todayActiveOrders.length} Order</p>
            <p className="text-xs text-slate-400 mt-0.5">Di luar order batal</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShoppingCart className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Omzet Hari Ini</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">{formatRupiah(omzetToday)}</p>
            <p className="text-xs text-slate-400 mt-0.5">Setelah dipotong diskon</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Uang Belum Masuk</p>
            <p className="text-2xl font-extrabold text-rose-600 mt-1">{formatRupiah(totalUnpaidAll)}</p>
            <p className="text-xs text-rose-500 font-medium mt-0.5">
              Dari {unpaidOrdersAll.length} order belum lunas
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Form Input Order */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="w-full px-5 py-4 bg-slate-900 text-white flex items-center justify-between font-bold text-base"
        >
          <span className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-emerald-400" />
            Catat Order Baru
          </span>
          <ChevronDown className={`w-5 h-5 transition-transform ${isFormOpen ? '' : 'rotate-180'}`} />
        </button>

        {isFormOpen && (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Pembeli / Kode Order *</label>
                <input
                  type="text"
                  required
                  value={buyer}
                  onChange={(e) => setBuyer(e.target.value)}
                  placeholder="Contoh: Kak Sinta / GoFood #GF-12"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nomor WhatsApp (Opsional)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Contoh: 08123456789"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none text-sm"
                />
              </div>
            </div>

            {/* Daftar Produk yang Dibeli */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">Barang yang Dibeli *</label>
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Barang Lain
                </button>
              </div>
              <div className="space-y-2">
                {orderItems.map((row, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={row.productId}
                      onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                      className="flex-1 px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white outline-none focus:border-emerald-500"
                    >
                      {products.length === 0 ? (
                        <option value="">-- Tambah produk dulu di tab Stok --</option>
                      ) : (
                        products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({formatRupiah(p.price)} | Stok: {p.stock})
                          </option>
                        ))
                      )}
                    </select>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={row.qty === 0 ? '' : row.qty}
                      onChange={(e) => {
                        const val = parseThousandInput(e.target.value);
                        handleItemChange(idx, 'qty', val);
                      }}
                      onBlur={() => {
                        if (!row.qty || row.qty < 1) handleItemChange(idx, 'qty', 1);
                      }}
                      className="w-20 px-3 py-2.5 rounded-xl border border-slate-300 text-sm text-center font-bold outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(idx)}
                      className="p-2.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Baris Diskon & Ongkir */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" /> Diskon Potongan Harga
                  </label>
                  <div className="inline-flex rounded-lg bg-slate-200 p-0.5 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setDiscountType('nominal')}
                      className={`px-2.5 py-1 rounded-md transition ${
                        discountType === 'nominal' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                      }`}
                    >
                      Rp
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDiscountType('percent');
                        if (discountValue > 100) setDiscountValue(100);
                      }}
                      className={`px-2.5 py-1 rounded-md transition ${
                        discountType === 'percent' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                      }`}
                    >
                      %
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={
                    discountType === 'nominal'
                      ? formatThousandInput(discountValue)
                      : discountValue === 0
                      ? ''
                      : discountValue
                  }
                  onChange={(e) => {
                    const raw = parseThousandInput(e.target.value);
                    setDiscountValue(raw);
                  }}
                  placeholder={discountType === 'percent' ? 'Contoh: 10 (untuk 10%)' : 'Contoh: 10.000'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm font-semibold outline-none focus:border-emerald-500"
                />
                {pricingPreview.discountAmount > 0 && (
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <p className="text-xs font-bold text-emerald-600">
                      ✓ Potongan Diskon: - {formatRupiah(pricingPreview.discountAmount)}
                    </p>
                    {((discountType === 'nominal' && Number(discountValue) > pricingPreview.subtotal) ||
                      (discountType === 'percent' && Number(discountValue) > 100)) && (
                      <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                        (Maksimal sesuai harga barang)
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Ongkos Kirim (Rp) - Opsional
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatThousandInput(shipping)}
                  onChange={(e) => setShipping(parseThousandInput(e.target.value))}
                  placeholder="Contoh: 10.000 (Kosongkan jika Rp 0)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm font-semibold outline-none focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Kosongkan jika diambil sendiri atau ongkir sudah ditanggung aplikasi
                </p>
              </div>
            </div>

            {/* Baris Pengiriman, Metode Pembayaran & Status Bayar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pengiriman / Channel</label>
                <select
                  value={deliveryMethod}
                  onChange={(e) => setDeliveryMethod(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold outline-none focus:border-emerald-500"
                >
                  {DELIVERY_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Metode Pembayaran</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold outline-none focus:border-emerald-500"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status Bayar</label>
                <select
                  value={payStatus}
                  onChange={(e) => setPayStatus(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold outline-none focus:border-emerald-500"
                >
                  <option value="Belum bayar">Belum bayar</option>
                  <option value="DP">DP (Uang Muka)</option>
                  <option value="Lunas">Lunas</option>
                </select>
              </div>
            </div>

            {payStatus === 'DP' && (
              <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-300">
                <label className="block text-xs font-bold text-amber-800 mb-1">
                  Nominal DP yang Sudah Masuk (Rp) *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatThousandInput(dpAmount)}
                  onChange={(e) => setDpAmount(parseThousandInput(e.target.value))}
                  placeholder="Contoh: 50.000"
                  className="w-full px-3.5 py-2 rounded-xl border border-amber-400 bg-white text-sm font-bold outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Singkat (Opsional)</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Contoh: Pedas sedang, driver GoSend plat B 1234 XX"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:border-emerald-500"
              />
            </div>

            {/* Box Ringkasan Perhitungan Akhir & Tombol Submit */}
            <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5 text-xs">
                <div className="text-slate-500">
                  Subtotal Barang: <strong className="text-slate-700">{formatRupiah(pricingPreview.subtotal)}</strong>
                  {pricingPreview.discountAmount > 0 && (
                    <span className="text-emerald-600 font-bold ml-2">
                      • Diskon: - {formatRupiah(pricingPreview.discountAmount)}
                    </span>
                  )}
                  {pricingPreview.shipping > 0 && (
                    <span className="text-slate-600 ml-2">
                      • Ongkir: + {formatRupiah(pricingPreview.shipping)}
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-slate-500 font-semibold">Total Akhir:</span>
                  <span className="text-2xl font-extrabold text-emerald-600">
                    {formatRupiah(pricingPreview.grandTotal)}
                  </span>
                  {payStatus === 'DP' && (
                    <span className="text-xs font-bold text-rose-600">
                      (Kurang: {formatRupiah(Math.max(0, pricingPreview.grandTotal - (Number(dpAmount) || 0)))})
                    </span>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition"
              >
                <CheckCircle2 className="w-5 h-5" />
                Simpan Order
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Filter & Pencarian */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama pembeli atau catatan..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:border-emerald-500"
            />
          </div>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:border-emerald-500"
          />
          <button
            type="button"
            onClick={() => setFilterDate('')}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
          >
            Semua Tanggal
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterOrdStatus}
            onChange={(e) => setFilterOrdStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white outline-none"
          >
            <option value="ALL">Semua Status Order</option>
            <option value="Baru">Status: Baru</option>
            <option value="Dikemas">Status: Dikemas</option>
            <option value="Dikirim">Status: Dikirim</option>
            <option value="Selesai">Status: Selesai</option>
            <option value="Batal">Status: Batal</option>
          </select>

          <select
            value={filterPayStatus}
            onChange={(e) => setFilterPayStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white outline-none"
          >
            <option value="ALL">Semua Status Bayar</option>
            <option value="BELUM_LUNAS">⚠️ Belum Lunas (Belum Bayar + DP)</option>
            <option value="Belum bayar">Belum bayar</option>
            <option value="DP">DP</option>
            <option value="Lunas">Lunas</option>
          </select>
        </div>
      </div>

      {/* Daftar Kartu Order */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-sm">
            Belum ada order yang sesuai dengan filter.
          </div>
        ) : (
          filteredOrders.map((o) => {
            const unpaid = getUnpaidAmount(o);
            const isBatal = o.orderStatus === 'Batal';

            return (
              <div
                key={o.id}
                className={`bg-white p-4 sm:p-5 rounded-2xl border shadow-sm space-y-3 ${
                  unpaid > 0 ? 'border-rose-200' : 'border-slate-200'
                } ${isBatal ? 'opacity-60' : ''}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-extrabold text-base text-slate-900">{o.buyer}</h4>
                      <span className="text-xs text-slate-400">• {formatTanggalIndo(o.date)}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full">
                        <Truck className="w-3 h-3 text-emerald-600" />
                        {o.deliveryMethod || 'Gojek / Grab Instan'}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full">
                        <CreditCard className="w-3 h-3" />
                        {o.paymentMethod || 'Transfer'}
                      </span>
                      {o.phone && <span className="text-xs text-slate-500">📱 {o.phone}</span>}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={`text-lg font-extrabold ${isBatal ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                      {formatRupiah(o.total)}
                    </p>
                    {unpaid > 0 ? (
                      <p className="text-xs font-bold text-rose-600">Belum masuk: {formatRupiah(unpaid)}</p>
                    ) : (
                      <p className="text-xs font-bold text-emerald-600">
                        {isBatal ? 'Dibatalkan' : `✓ Lunas (${o.paymentMethod || 'Transfer'})`}
                      </p>
                    )}
                  </div>
                </div>

                {/* Rincian Barang, Diskon, Ongkir */}
                <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
                  {o.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-slate-700">
                      <span>
                        • {it.name} <strong className="text-slate-900">x{it.qty}</strong>
                      </span>
                      <span className="font-semibold">{formatRupiah(it.price * it.qty)}</span>
                    </div>
                  ))}

                  {o.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold pt-1 border-t border-slate-200/70">
                      <span>
                        Diskon Potongan{' '}
                        {o.discountType === 'percent' ? `(${o.discountValue}%)` : ''}
                      </span>
                      <span>- {formatRupiah(o.discountAmount)}</span>
                    </div>
                  )}

                  {o.shipping > 0 && (
                    <div className="flex justify-between text-slate-500 pt-1 border-t border-slate-200/70">
                      <span>Ongkos Kirim</span>
                      <span>+ {formatRupiah(o.shipping)}</span>
                    </div>
                  )}

                  {o.payStatus === 'DP' && (
                    <div className="flex justify-between text-amber-700 font-semibold pt-1 border-t border-slate-200/70">
                      <span>DP Sudah Masuk</span>
                      <span>- {formatRupiah(o.dpAmount)}</span>
                    </div>
                  )}
                </div>

                {o.note && (
                  <p className="text-xs text-slate-600 bg-amber-50/60 px-3 py-2 rounded-xl border border-amber-100">
                    📝 <strong>Catatan:</strong> {o.note}
                  </p>
                )}

                {/* Kontrol Ubah Status Cepat */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={o.orderStatus}
                      onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-white outline-none"
                    >
                      {['Baru', 'Dikemas', 'Dikirim', 'Selesai', 'Batal'].map((s) => (
                        <option key={s} value={s}>
                          Order: {s}
                        </option>
                      ))}
                    </select>

                    <select
                      value={o.payStatus}
                      onChange={(e) => handlePayStatusSelect(o, e.target.value)}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-white outline-none"
                    >
                      {['Belum bayar', 'DP', 'Lunas'].map((s) => (
                        <option key={s} value={s}>
                          Bayar: {s}
                        </option>
                      ))}
                    </select>

                    <select
                      value={o.paymentMethod || 'Transfer'}
                      onChange={(e) => updatePaymentMethod(o.id, e.target.value)}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-white outline-none"
                    >
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m} value={m}>
                          Via: {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    {unpaid > 0 && (
                      <button
                        type="button"
                        onClick={() => setInvoiceOrder(o)}
                        className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                      >
                        <MessageSquareText className="w-4 h-4" />
                        Buat Pesan Tagihan
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Hapus order "${o.buyer}"?`)) deleteOrder(o.id);
                      }}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-400 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}