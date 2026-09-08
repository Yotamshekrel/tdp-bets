import React from 'react';
import { ToastMessage } from '../types';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-3 p-4 rounded-xl border shadow-lg transition-all animate-in slide-in-from-top-2 ${
            toast.type === 'success'
              ? 'bg-slate-800 border-emerald-500/50 text-emerald-300'
              : toast.type === 'error'
              ? 'bg-slate-800 border-rose-500/50 text-rose-300'
              : 'bg-slate-800 border-indigo-500/50 text-indigo-300'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          {toast.type === 'info' && <Info className="w-5 h-5 flex-shrink-0" />}
          <p className="text-sm font-medium flex-1">{toast.message}</p>
          <button
            onClick={() => onDismiss(toast.id)}
            className="p-1 hover:opacity-80 transition-opacity"
            aria-label="Dismiss toast"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
