import React, { useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { BetPage } from './pages/BetPage';
import { ResultsPage } from './pages/ResultsPage';
import { ToastContainer } from './components/Toast';
import { ToastMessage } from './types';

export const App: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <HashRouter>
      <div className="min-h-screen bg-slate-900 text-slate-100">
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
        <Routes>
          <Route path="/" element={<HomePage onShowToast={addToast} />} />
          <Route path="/bet" element={<BetPage onShowToast={addToast} />} />
          <Route path="/results" element={<ResultsPage onShowToast={addToast} />} />
        </Routes>
      </div>
    </HashRouter>
  );
};

export default App;