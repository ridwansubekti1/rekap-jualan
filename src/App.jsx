import React from 'react';
import { CheckCircle } from 'lucide-react';
import { useStore } from './context/StoreContext';
import Header from './components/Header';
import OrderTab from './components/OrderTab';
import StockTab from './components/StockTab';
import RecapTab from './components/RecapTab';
import InvoiceModal from './components/InvoiceModal';
import LoginPage from './components/LoginPage';

export default function App() {
  const { session, authLoading, dataLoading, activeTab, toastMsg } = useStore();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm font-bold text-slate-500">
        Memeriksa sesi login...
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-4xl mx-auto px-4 pt-4">
        {dataLoading ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-sm font-bold text-slate-500">
            Memuat data toko dari Cloud...
          </div>
        ) : (
          <>
            {activeTab === 'order' && <OrderTab />}
            {activeTab === 'stok' && <StockTab />}
            {activeTab === 'rekap' && <RecapTab />}
          </>
        )}
      </main>

      <InvoiceModal />

      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-lg text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}