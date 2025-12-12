import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md', // sm, md, lg, xl, full
    className = ''
}) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-2xl',
        full: 'max-w-full m-4',
    };

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop with blur */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal Content */}
            <div
                className={`bg-white rounded-2xl shadow-xl w-full relative z-10 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 ${sizeClasses[size]} ${className}`}
                role="dialog"
                aria-modal="true"
            >
                {/* Header */}
                {(title || onClose) && (
                    <div className="flex items-center justify-between p-6 border-b border-gray-100">
                        {title && <h2 className="text-xl font-bold text-gray-800">{title}</h2>}
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
                                aria-label="Close modal"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                )}

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default Modal;
