import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

type ToastType = 'success' | 'error';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`
              min-w-[300px] max-w-md p-4 rounded-xl shadow-2xl flex items-center gap-3 transform transition-all duration-500 animate-slide-in
              ${toast.type === 'success' ? 'bg-white border-l-4 border-green-500 text-gray-800' : 'bg-white border-l-4 border-red-500 text-gray-800'}
            `}
          >
            {toast.type === 'success' ? <CheckCircle className="text-green-500" size={20} /> : <XCircle className="text-red-500" size={20} />}
            <p className="flex-1 text-sm font-bold">{toast.message}</p>
            <button onClick={() => removeToast(toast.id)} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};