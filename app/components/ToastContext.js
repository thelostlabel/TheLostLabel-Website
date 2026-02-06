"use client";
import { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error("useToast must be used within a ToastProvider");
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const [confirm, setConfirm] = useState(null);

    const showToast = useCallback((message, type = 'info', duration = 5000) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type, duration }]);

        if (duration !== Infinity) {
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, duration);
        }
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showConfirm = useCallback((title, message, onConfirm, onCancel) => {
        setConfirm({ title, message, onConfirm, onCancel });
    }, []);

    const handleConfirm = () => {
        if (confirm?.onConfirm) confirm.onConfirm();
        setConfirm(null);
    };

    const handleCancel = () => {
        if (confirm?.onCancel) confirm.onCancel();
        setConfirm(null);
    };

    return (
        <ToastContext.Provider value={{ showToast, removeToast, showConfirm }}>
            {children}
            <AnimatePresence>
                {confirm && (
                    <ConfirmModal
                        title={confirm.title}
                        message={confirm.message}
                        onConfirm={handleConfirm}
                        onCancel={handleCancel}
                    />
                )}
            </AnimatePresence>
            <div style={{
                position: 'fixed',
                bottom: '40px',
                right: '40px',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                pointerEvents: 'none'
            }}>
                <AnimatePresence mode="popLayout">
                    {toasts.map((toast) => (
                        <Toast key={toast.id} {...toast} onRemove={() => removeToast(toast.id)} />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

const Toast = ({ id, message, type, onRemove }) => {
    const icons = {
        success: <CheckCircle size={18} color="#00ff88" />,
        error: <AlertCircle size={18} color="#ff4444" />,
        warning: <AlertTriangle size={18} color="#ffaa00" />,
        info: <Info size={18} color="#00aaff" />
    };

    const colors = {
        success: 'rgba(0, 255, 136, 0.1)',
        error: 'rgba(255, 68, 68, 0.1)',
        warning: 'rgba(255, 170, 0, 0.1)',
        info: 'rgba(0, 170, 255, 0.1)'
    };

    const borders = {
        success: 'rgba(0, 255, 136, 0.2)',
        error: 'rgba(255, 68, 68, 0.2)',
        warning: 'rgba(255, 170, 0, 0.2)',
        info: 'rgba(0, 170, 255, 0.2)'
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            style={{
                background: 'rgba(10, 10, 10, 0.8)',
                backdropFilter: 'blur(20px)',
                border: `1px solid ${borders[type]}`,
                padding: '16px 20px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                minWidth: '300px',
                maxWidth: '450px',
                pointerEvents: 'auto',
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                width: '4px',
                background: type === 'success' ? '#00ff88' : type === 'error' ? '#ff4444' : type === 'warning' ? '#ffaa00' : '#00aaff',
                opacity: 0.5
            }} />

            <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: colors[type],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
            }}>
                {icons[type]}
            </div>

            <div style={{ flex: 1 }}>
                <p style={{
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: '600',
                    margin: 0,
                    lineHeight: '1.4'
                }}>
                    {message}
                </p>
            </div>

            <button
                onClick={onRemove}
                style={{
                    background: 'none',
                    border: 'none',
                    color: '#444',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 0.2s'
                }}
            >
                <X size={16} />
            </button>
        </motion.div>
    );
};

const ConfirmModal = ({ title, message, onConfirm, onCancel }) => {
    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(10px)',
            padding: '20px'
        }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                style={{
                    background: '#0a0a0b',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '24px',
                    padding: '40px',
                    maxWidth: '450px',
                    width: '100%',
                    textAlign: 'center',
                    boxShadow: '0 40px 100px rgba(0,0,0,0.8)'
                }}
            >
                <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '20px',
                    background: 'rgba(255, 68, 68, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 25px'
                }}>
                    <AlertTriangle size={24} color="#ff4444" />
                </div>

                <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#fff', marginBottom: '12px' }}>{title}</h3>
                <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.6', marginBottom: '35px' }}>{message}</p>

                <div style={{ display: 'flex', gap: '15px' }}>
                    <button
                        onClick={onCancel}
                        style={{
                            flex: 1,
                            padding: '15px',
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            color: '#666',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '900',
                            letterSpacing: '1px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        ABORT_ACTION
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            flex: 1,
                            padding: '15px',
                            background: '#ff4444',
                            border: 'none',
                            color: '#fff',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '900',
                            letterSpacing: '1px',
                            cursor: 'pointer',
                            boxShadow: '0 10px 30px rgba(255, 68, 68, 0.2)',
                            transition: 'all 0.2s'
                        }}
                    >
                        CONFIRM_EXECUTE
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
