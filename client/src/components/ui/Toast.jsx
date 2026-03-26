import { useState, useCallback } from 'react';
import { createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 5000) => {
        const id = ++toastId;
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const toast = {
        success: (msg) => addToast(msg, 'success'),
        error: (msg) => addToast(msg, 'error'),
        info: (msg) => addToast(msg, 'info'),
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
                <AnimatePresence>
                    {toasts.map((t) => (
                        <motion.div
                            key={t.id}
                            initial={{ opacity: 0, x: 50, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 50, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className={`flex items-start gap-3 px-4 py-3 rounded-sm border shadow-xl ${t.type === 'error'
                                    ? 'bg-px-error/10 border-px-error/30 text-px-error'
                                    : t.type === 'success'
                                        ? 'bg-px-success/10 border-px-success/30 text-px-success'
                                        : 'bg-px-surface border-px-border text-px-text'
                                }`}
                        >
                            {t.type === 'error' && <AlertCircle size={16} className="mt-0.5 shrink-0" />}
                            {t.type === 'success' && <CheckCircle size={16} className="mt-0.5 shrink-0" />}
                            {t.type === 'info' && <Info size={16} className="mt-0.5 shrink-0" />}
                            <span className="font-mono text-xs flex-1">{t.message}</span>
                            <button
                                onClick={() => removeToast(t.id)}
                                className="p-0.5 opacity-50 hover:opacity-100 transition-default cursor-pointer"
                            >
                                <X size={12} />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
}
