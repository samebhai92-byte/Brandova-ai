import React, { createContext, useContext, useState, useCallback } from 'react';
import { Loader2, X, Check, AlertCircle, Info } from 'lucide-react';

// --- Toast Context ---
type ToastType = 'success' | 'error' | 'info';
interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

const ToastContext = createContext<{ showToast: (msg: string, type: ToastType) => void }>({ showToast: () => {} });

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4">
        {toasts.map(t => (
          <div key={t.id} className={`
            flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-xl border animate-in fade-in slide-in-from-top-2
            ${t.type === 'success' ? 'bg-emerald-900/80 border-emerald-500/50 text-emerald-100' : 
              t.type === 'error' ? 'bg-red-900/80 border-red-500/50 text-red-100' : 
              'bg-indigo-900/80 border-indigo-500/50 text-indigo-100'}
          `}>
            {t.type === 'success' && <Check className="w-4 h-4" />}
            {t.type === 'error' && <AlertCircle className="w-4 h-4" />}
            {t.type === 'info' && <Info className="w-4 h-4" />}
            <span className="text-sm font-medium">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

// --- Components ---

export const GlassCard: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = '', onClick }) => (
  <div onClick={onClick} className={`glass-card rounded-2xl p-4 md:p-6 border border-white/10 shadow-lg ${onClick ? 'cursor-pointer active:scale-[0.98] transition-all duration-200' : ''} ${className}`}>
    {children}
  </div>
);

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost', isLoading?: boolean }> = ({ 
  children, variant = 'primary', isLoading, className = '', ...props 
}) => {
  const baseStyle = "relative flex items-center justify-center px-6 py-3 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";
  
  const variants = {
    primary: "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 border border-white/10 hover:border-white/20",
    secondary: "bg-white/10 text-white hover:bg-white/15 border border-white/5",
    outline: "bg-transparent border border-white/20 text-white hover:bg-white/5 hover:border-white/30",
    ghost: "bg-transparent text-gray-400 hover:text-white hover:bg-white/5"
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} disabled={isLoading || props.disabled} {...props}>
      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : children}
    </button>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = '', ...props }) => (
  <input 
    className={`w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all ${className}`}
    {...props}
  />
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className = '', children, ...props }) => (
  <div className="relative">
    <select 
      className={`w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all ${className}`}
      {...props}
    >
      {children}
    </select>
    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
      ▼
    </div>
  </div>
);

export const Badge: React.FC<{ children: React.ReactNode; color?: 'green' | 'blue' | 'purple' | 'red' | 'gold' }> = ({ children, color = 'blue' }) => {
  const colors = {
    green: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    purple: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    red: "bg-red-500/20 text-red-400 border-red-500/30",
    gold: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${colors[color]}`}>
      {children}
    </span>
  );
};
