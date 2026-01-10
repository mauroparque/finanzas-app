import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    const [show, setShow] = useState(isOpen);

    useEffect(() => {
        if (isOpen) setShow(true);
        else setTimeout(() => setShow(false), 300); // Wait for animation
    }, [isOpen]);

    if (!show && !isOpen) return null;

    return (
        <div className={`fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Content */}
            <div className={`
        relative w-full sm:max-w-md bg-slate-900 border-t sm:border border-white/10 rounded-t-[2rem] sm:rounded-2xl p-6 shadow-2xl transform transition-all duration-300
        ${isOpen ? 'translate-y-0 scale-100' : 'translate-y-full sm:translate-y-10 sm:scale-95'}
      `}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="max-h-[80vh] overflow-y-auto custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
