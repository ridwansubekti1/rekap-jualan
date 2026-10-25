import React, { useState, useEffect } from 'react';
import { Send, X, Copy, ExternalLink } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatRupiah, formatWaNumber, getUnpaidAmount } from '../utils/formatters';

export default function InvoiceModal() {
  const { invoiceOrder, setInvoiceOrder, showToast } = useStore();
  const [text, setText] = useState('');

  useEffect(() => {
    if (!invoiceOrder) return;
    const o = invoiceOrder;
    const unpaid = getUnpaidAmount(o);
    const rincian = o.items
      .map((it) => `- ${it.name} (x${it.qty}): ${formatRupiah(it.price * it.qty)}`)
      .join('\n');

    const discLine =
      o.discountAmount > 0
        ? `\nDiskon${o.discountType === 'percent' ? ` (${o.discountValue}%)` : ''}: - ${formatRupiah(o.discountAmount)}`
        : '';
    const shipLine = o.shipping > 0 ? `\nOngkir: + ${formatRupiah(o.shipping)}` : '';
    const dpLine = o.payStatus === 'DP' ? `\nDP sudah diterima: ${formatRupiah(o.dpAmount)}` : '';

    const template = `Halo Kak ${o.buyer} 😊🙏
Terima kasih sudah pesan di tempat kami. Berikut rincian pesanan Kakak:

${rincian}${discLine}${shipLine}
-------------------------
Total Tagihan: *${formatRupiah(o.total)}*${dpLine}
Sisa yang belum dibayar: *${formatRupiah(unpaid)}*
Metode Bayar: *${o.paymentMethod || 'Transfer / QRIS'}*
Pengiriman: *${o.deliveryMethod || 'Instan'}*

Mohon kabari kalau sudah selesai pembayaran ya Kak, supaya pesanan segera kami proses. Terima kasih banyak! 🙏✨`;

    setText(template);
  }, [invoiceOrder]);

  if (!invoiceOrder) return null;

  const waNum = formatWaNumber(invoiceOrder.phone);
  const waHref = waNum
    ? `https://wa.me/${waNum}?text=${encodeURIComponent(text)}`
    : `https://wa.me/?text=${encodeURIComponent(text)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    showToast('Teks tagihan berhasil disalin!');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
            <Send className="w-5 h-5 text-emerald-600" />
            Pesan Tagihan WhatsApp
          </h3>
          <button
            onClick={() => setInvoiceOrder(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <textarea
          rows="10"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 outline-none focus:border-emerald-500"
        />

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleCopy}
            className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5"
          >
            <Copy className="w-4 h-4" />
            Salin Teks
          </button>
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5"
          >
            <ExternalLink className="w-4 h-4" />
            Buka di WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}