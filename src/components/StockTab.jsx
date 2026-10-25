import React, { useState } from 'react';
import { AlertTriangle, PackagePlus, Save, Pencil, Trash } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatRupiah } from '../utils/formatters';

export default function StockTab() {
  const { products, saveProduct, adjustStock, deleteProduct } = useStore();

  const [editId, setEditId] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [minStock, setMinStock] = useState(3);

  // Format angka menjadi teks bertitik ribuan (contoh: 22000 -> "22.000")
  const formatThousandInput = (val) => {
    if (val === '' || val === null || val === undefined) return '';
    const cleaned = String(val).replace(/\D/g, '');
    if (cleaned === '') return '';
    return Number(cleaned).toLocaleString('id-ID');
  };

  // Ambil angka murni dari ketikan yang ada titiknya (contoh: "22.000" -> 22000)
  const parseThousandInput = (str) => {
    const cleaned = String(str).replace(/\D/g, '');
    return cleaned === '' ? '' : Number(cleaned);
  };

  // Bersihkan input stok (izinkan tanda minus di depan jika stok minus / PO)
  const handleStockInput = (str) => {
    const cleaned = String(str).replace(/[^0-9-]/g, '').replace(/(?!^)-/g, '');
    if (cleaned === '' || cleaned === '-') return cleaned;
    return Number(cleaned);
  };

  const restokItems = products.filter((p) => Number(p.stock) <= Number(p.minStock));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    saveProduct({
      id: editId || undefined,
      name: name.trim(),
      price: Number(price) || 0,
      stock: Number(stock) || 0,
      minStock: minStock === '' ? 3 : Number(minStock)
    });
    resetForm();
  };

  const handleEdit = (p) => {
    setEditId(p.id);
    setName(p.name);
    setPrice(p.price);
    setStock(p.stock);
    setMinStock(p.minStock);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditId('');
    setName('');
    setPrice('');
    setStock('');
    setMinStock(3);
  };

  return (
    <section className="space-y-5">
      {restokItems.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-rose-700 font-extrabold text-sm mb-2">
            <AlertTriangle className="w-5 h-5" />
            <span>Daftar Barang Perlu Restok!</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {restokItems.map((p) => (
              <span
                key={p.id}
                className="px-3 py-1.5 rounded-xl bg-white border border-rose-300 text-rose-700 font-bold text-xs flex items-center gap-1.5"
              >
                <span>{p.name}</span>
                <span className="bg-rose-600 text-white px-1.5 py-0.5 rounded-md text-[11px]">
                  Sisa {p.stock}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Form Tambah / Edit Produk */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="font-extrabold text-base text-slate-900 mb-3 flex items-center gap-2">
          <PackagePlus className="w-5 h-5 text-emerald-600" />
          {editId ? 'Edit Produk' : 'Tambah Produk Baru'}
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama Produk *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Ayam Geprek Sambal Korek"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Harga Jual (Rp) *</label>
            <input
              type="text"
              inputMode="numeric"
              required
              value={formatThousandInput(price)}
              onChange={(e) => setPrice(parseThousandInput(e.target.value))}
              placeholder="Contoh: 22.000"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold outline-none focus:border-emerald-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Stok *</label>
              <input
                type="text"
                inputMode="numeric"
                required
                value={stock}
                onChange={(e) => setStock(handleStockInput(e.target.value))}
                placeholder="20"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Batas Restok</label>
              <input
                type="text"
                inputMode="numeric"
                required
                value={minStock}
                onChange={(e) => setMinStock(parseThousandInput(e.target.value))}
                placeholder="3"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <div className="sm:col-span-4 flex justify-end gap-2 pt-2">
            {editId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Batal Edit
              </button>
            )}
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition"
            >
              <Save className="w-4 h-4" />
              <span>{editId ? 'Update Produk' : 'Simpan Produk'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Daftar Produk */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-800">Daftar Produk & Stok</h3>
          <span className="text-xs text-slate-500">{products.length} produk</span>
        </div>

        <div className="divide-y divide-slate-100">
          {products.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              Belum ada produk. Tambahkan di atas atau klik tombol <strong>Data Contoh</strong>.
            </div>
          ) : (
            products.map((p) => {
              const isLow = Number(p.stock) <= Number(p.minStock);
              return (
                <div
                  key={p.id}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isLow ? 'bg-rose-50/50' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{p.name}</span>
                      {isLow && (
                        <span className="text-[11px] font-extrabold bg-rose-600 text-white px-2 py-0.5 rounded-full">
                          Perlu Restok!
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                      {formatRupiah(p.price)}{' '}
                      <span className="text-slate-400 font-normal">• Batas restok: ≤ {p.minStock}</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => adjustStock(p.id, -1)}
                        className="w-8 h-8 rounded-lg bg-white hover:bg-slate-50 font-bold text-slate-700"
                      >
                        -
                      </button>
                      <span className={`px-3 font-extrabold text-sm ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>
                        {p.stock}
                      </span>
                      <button
                        type="button"
                        onClick={() => adjustStock(p.id, 1)}
                        className="w-8 h-8 rounded-lg bg-white hover:bg-slate-50 font-bold text-slate-700"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEdit(p)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Hapus produk "${p.name}"?`)) deleteProduct(p.id);
                        }}
                        className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}