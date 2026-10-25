import React, { useState, useRef } from 'react';
import { Calendar, MessageCircle, ImageDown } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useStore } from '../context/StoreContext';
import {
  getJakartaDateString,
  formatTanggalIndo,
  formatRupiah,
  getPaidAmount,
  getUnpaidAmount
} from '../utils/formatters';

export default function RecapTab() {
  const { products, orders, showToast } = useStore();
  const [rekapDate, setRekapDate] = useState(getJakartaDateString());
  const cardRef = useRef(null);

  const ordersOnDate = orders.filter((o) => o.date === rekapDate);
  const activeOrders = ordersOnDate.filter((o) => o.orderStatus !== 'Batal');
  const batalOrders = ordersOnDate.filter((o) => o.orderStatus === 'Batal');

  const omzet = activeOrders.reduce((s, o) => s + o.total, 0);
  const totalDiskon = activeOrders.reduce((s, o) => s + (Number(o.discountAmount) || 0), 0);
  const paidIn = activeOrders.reduce((s, o) => s + getPaidAmount(o), 0);
  const unpaidOrders = activeOrders.filter((o) => getUnpaidAmount(o) > 0);
  const unpaidTotal = unpaidOrders.reduce((s, o) => s + getUnpaidAmount(o), 0);

  // Rincian uang masuk per metode pembayaran (Tunai, Transfer, QRIS)
  const methodBreakdown = { Tunai: 0, Transfer: 0, QRIS: 0 };
  activeOrders.forEach((o) => {
    const method = o.paymentMethod || 'Transfer';
    const paid = getPaidAmount(o);
    methodBreakdown[method] = (methodBreakdown[method] || 0) + paid;
  });

  // Barang paling laku
  const productCounts = {};
  activeOrders.forEach((o) => {
    o.items.forEach((it) => {
      if (!productCounts[it.name]) {
        productCounts[it.name] = { name: it.name, qty: 0, revenue: 0 };
      }
      productCounts[it.name].qty += Number(it.qty);
      productCounts[it.name].revenue += Number(it.qty) * Number(it.price);
    });
  });
  const topProducts = Object.values(productCounts)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const restokProducts = products.filter((p) => Number(p.stock) <= Number(p.minStock));

  const handleShareWA = () => {
    const topList =
      topProducts.length > 0
        ? topProducts.map((p, i) => `${i + 1}. ${p.name} (${p.qty} pcs)`).join('\n')
        : '- Belum ada penjualan';

    const restokList =
      restokProducts.length > 0
        ? restokProducts.map((p) => `- ${p.name} (Sisa ${p.stock})`).join('\n')
        : '- Stok aman semua';

    const text = `📊 *REKAP JUALAN HARIAN*
📅 ${formatTanggalIndo(rekapDate)}

• Jumlah Order: *${activeOrders.length} order* (${batalOrders.length} batal)
• Total Omzet Bersih: *${formatRupiah(omzet)}*
• Total Diskon Diberikan: *${formatRupiah(totalDiskon)}*
• Uang Sudah Masuk: *${formatRupiah(paidIn)}*
  - Tunai: ${formatRupiah(methodBreakdown.Tunai)}
  - Transfer: ${formatRupiah(methodBreakdown.Transfer)}
  - QRIS: ${formatRupiah(methodBreakdown.QRIS)}
• Uang Belum Masuk: *${formatRupiah(unpaidTotal)}* (${unpaidOrders.length} order)

🔥 *Barang Paling Laku:*
${topList}

⚠️ *Perlu Restok:*
${restokList}`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleDownloadPNG = async () => {
    if (!cardRef.current) return;
    showToast('Menyiapkan gambar PNG...');
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = `Rekap-Jualan-${rekapDate}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast('Gambar rekap berhasil diunduh!');
    } catch {
      alert('Gagal mengunduh gambar PNG.');
    }
  };

  return (
    <section className="space-y-5">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-600" />
          <span className="font-bold text-sm">Pilih Tanggal Rekap:</span>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="date"
            value={rekapDate}
            onChange={(e) => setRekapDate(e.target.value)}
            className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-bold outline-none focus:border-emerald-500"
          />
          <button
            type="button"
            onClick={() => setRekapDate(getJakartaDateString())}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs hover:bg-emerald-100"
          >
            Hari Ini
          </button>
        </div>
      </div>

      {/* Kartu Struk Rekap (Target Capture PNG) */}
      <div
        ref={cardRef}
        className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-sm space-y-5 max-w-xl mx-auto"
      >
        <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-4">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              Laporan Harian
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 mt-1.5">Rekap Jualan</h2>
            <p className="text-xs text-slate-500 font-medium">{formatTanggalIndo(rekapDate)}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-extrabold text-xl">
            R
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <p className="text-xs text-slate-500 font-semibold">Jumlah Order</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">{activeOrders.length} Order</p>
            <p className="text-[11px] text-slate-400">
              {batalOrders.length} batal • Diskon: {formatRupiah(totalDiskon)}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100">
            <p className="text-xs text-emerald-700 font-semibold">Total Omzet</p>
            <p className="text-xl font-extrabold text-emerald-700 mt-0.5">{formatRupiah(omzet)}</p>
            <p className="text-[11px] text-emerald-600 font-medium">Sudah masuk: {formatRupiah(paidIn)}</p>
          </div>

          {/* Breakdown Metode Pembayaran (Tunai, Transfer, QRIS) */}
          <div className="col-span-2 grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
            <div>
              <p className="text-[11px] text-slate-500 font-semibold">Uang Tunai</p>
              <p className="text-xs font-extrabold text-slate-800 mt-0.5">
                {formatRupiah(methodBreakdown.Tunai)}
              </p>
            </div>
            <div className="border-x border-slate-200">
              <p className="text-[11px] text-slate-500 font-semibold">Transfer Bank</p>
              <p className="text-xs font-extrabold text-slate-800 mt-0.5">
                {formatRupiah(methodBreakdown.Transfer)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-semibold">QRIS</p>
              <p className="text-xs font-extrabold text-slate-800 mt-0.5">
                {formatRupiah(methodBreakdown.QRIS)}
              </p>
            </div>
          </div>

          <div className="col-span-2 p-3.5 rounded-2xl bg-rose-50/70 border border-rose-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-rose-700 font-semibold">Uang Belum Masuk (Tanggal Ini)</p>
              <p className="text-lg font-extrabold text-rose-600 mt-0.5">{formatRupiah(unpaidTotal)}</p>
            </div>
            <span className="text-xs font-bold bg-white text-rose-600 px-2.5 py-1 rounded-lg border border-rose-200">
              {unpaidOrders.length} order
            </span>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">
            🔥 Barang Paling Laku
          </h4>
          <div className="space-y-1.5 text-sm">
            {topProducts.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Belum ada penjualan di tanggal ini.</p>
            ) : (
              topProducts.map((p, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-xl">
                  <span className="font-bold text-xs text-slate-800">
                    {i + 1}. {p.name}
                  </span>
                  <span className="text-xs font-extrabold text-emerald-700">
                    {p.qty} pcs ({formatRupiah(p.revenue)})
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-dashed border-slate-200">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-rose-600 mb-2">
            ⚠️ Perlu Restok Sekarang
          </h4>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {restokProducts.length === 0 ? (
              <span className="text-xs text-emerald-600 font-semibold">✓ Semua stok aman</span>
            ) : (
              restokProducts.map((p) => (
                <span
                  key={p.id}
                  className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-bold"
                >
                  {p.name} (Sisa {p.stock})
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Tombol Aksi */}
      <div className="max-w-xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={handleShareWA}
          className="py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition"
        >
          <MessageCircle className="w-5 h-5" />
          Kirim Rekap ke WhatsApp
        </button>
        <button
          type="button"
          onClick={handleDownloadPNG}
          className="py-3.5 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition"
        >
          <ImageDown className="w-5 h-5" />
          Unduh Gambar Rekap (PNG)
        </button>
      </div>
    </section>
  );
}