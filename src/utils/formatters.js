// Zona waktu Asia/Jakarta (YYYY-MM-DD)
export function getJakartaDateString(dateObj = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(dateObj);
}

// Format Tanggal Bahasa Indonesia
export function formatTanggalIndo(yyyyMmDd) {
  if (!yyyyMmDd) return '-';
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

// Format Angka ke Rupiah
export function formatRupiah(num) {
  const n = Number(num) || 0;
  return 'Rp ' + Math.round(n).toLocaleString('id-ID');
}

// Konversi nomor 08xx ke 628xx untuk link wa.me
export function formatWaNumber(phone) {
  if (!phone) return '';
  let clean = phone.replace(/\D/g, '');
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  }
  return clean;
}

// Kalkulator Otomatis Subtotal, Diskon (Rp / %), Ongkir, dan Total Akhir
export function calculateOrderPricing(items, discountType, discountValue, shippingCost) {
  const subtotal = items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 0), 0);
  const rawDiscVal = Math.max(0, Number(discountValue) || 0);
  const shipping = Math.max(0, Number(shippingCost) || 0);

  let discountAmount = 0;
  if (discountType === 'percent') {
    const validPercent = Math.min(100, rawDiscVal);
    discountAmount = Math.round(subtotal * (validPercent / 100));
  } else {
    discountAmount = Math.min(subtotal, rawDiscVal);
  }

  const totalAfterDiscount = Math.max(0, subtotal - discountAmount);
  const grandTotal = totalAfterDiscount + shipping;

  return {
    subtotal,
    discountType,
    discountValue: rawDiscVal,
    discountAmount,
    shipping,
    grandTotal
  };
}

// Hitung sisa tagihan yang belum masuk per order
export function getUnpaidAmount(order) {
  if (order.orderStatus === 'Batal') return 0;
  if (order.payStatus === 'Lunas') return 0;
  if (order.payStatus === 'DP') return Math.max(0, order.total - (Number(order.dpAmount) || 0));
  return order.total;
}

// Hitung uang yang sudah masuk per order
export function getPaidAmount(order) {
  if (order.orderStatus === 'Batal') return 0;
  if (order.payStatus === 'Lunas') return order.total;
  if (order.payStatus === 'DP') return Math.min(order.total, Number(order.dpAmount) || 0);
  return 0;
}