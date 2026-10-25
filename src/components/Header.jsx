import React from 'react';
import { ShoppingBag, Package, BarChart3, Sparkles, Download, Upload, Trash2, LogOut } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { getJakartaDateString, formatTanggalIndo } from '../utils/formatters';

export default function Header() {
  const {
    products,
    orders,
    activeTab,
    setActiveTab,
    loadSample,
    clearAll,
    restoreFromJson,
    showToast,
    signOutAdmin
  } = useStore();

  const todayStr = getJakartaDateString();
  const lowStockCount = products.filter((p) => Number(p.stock) <= Number(p.minStock)).length;

  const handleExport = () => {
    const dataStr = JSON.stringify({ products, orders }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-rekap-jualan-${todayStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('File Backup JSON berhasil diunduh!');
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!Array.isArray(parsed.products) || !Array.isArray(parsed.orders)) {
          alert('Format file JSON tidak sesuai!');
          return;
        }
        restoreFromJson(parsed);
      } catch {
        alert('File JSON tidak valid.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSampleClick = () => {
    if (products.length > 0 || orders.length > 0) {
      if (!window.confirm('Timpa data saat ini dengan Data Contoh?')) return;
    }
    loadSample();
  };

  const handleClearClick = () => {
    if (window.confirm('⚠️ Yakin ingin MENGHAPUS SEMUA data order dan stok?')) {
      clearAll();
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-4xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          {/* Logo Baru dari public/icon.svg */}
          <img
            src="/icon.svg"
            alt="Logo Rekap Jualan"
            className="w-10 h-10 rounded-xl shadow-sm object-cover"
          />
          <div>
            <h1 className="font-extrabold text-lg leading-tight text-slate-900">Rekap Jualan</h1>
            <p className="text-xs text-slate-500">{formatTanggalIndo(todayStr)} • WIB</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleSampleClick}
            className="text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-2 rounded-lg flex items-center gap-1 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Data Contoh</span>
          </button>

          <button
            onClick={handleExport}
            className="text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-2 rounded-lg flex items-center gap-1 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Backup</span>
          </button>

          <label className="text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-2 rounded-lg flex items-center gap-1 cursor-pointer transition">
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pulihkan</span>
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>

          <button
            onClick={handleClearClick}
            className="text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-600 px-2.5 py-2 rounded-lg flex items-center gap-1 transition"
            title="Hapus Semua Data"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={signOutAdmin}
            className="text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white px-2.5 py-2 rounded-lg flex items-center gap-1 transition"
            title="Keluar Akun Admin"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-4xl mx-auto px-4 pb-3 pt-1">
        <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('order')}
            className={`py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition ${
              activeTab === 'order'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Order</span>
          </button>

          <button
            onClick={() => setActiveTab('stok')}
            className={`py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition ${
              activeTab === 'stok'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Stok</span>
            {lowStockCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {lowStockCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('rekap')}
            className={`py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition ${
              activeTab === 'rekap'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Rekap</span>
          </button>
        </div>
      </div>
    </header>
  );
}