import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import gsap from 'gsap';

const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md', // sm, md, lg, xl, full
    className = ''
}) => {
    const backdropRef = useRef(null);
    const modalRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';

            // Animate backdrop and modal on open
            if (backdropRef.current) {
                gsap.fromTo(backdropRef.current,
                    { opacity: 0 },
                    { opacity: 1, duration: 0.25, ease: 'power2.out' }
                );
            }
            if (modalRef.current) {
                gsap.fromTo(modalRef.current,
                    { opacity: 0, scale: 0.9, y: 20 },
                    { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: 'back.out(1.5)', delay: 0.05 }
                );
            }
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Escape key handler
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && onClose) onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEscape);
        }
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-2xl',
        full: 'max-w-full m-4',
    };

    const handleClose = () => {
        // Animate out before closing
        const tl = gsap.timeline({
            onComplete: () => onClose && onClose()
        });

        if (modalRef.current) {
            tl.to(modalRef.current, { opacity: 0, scale: 0.95, y: 10, duration: 0.2, ease: 'power2.in' }, 0);
        }
        if (backdropRef.current) {
            tl.to(backdropRef.current, { opacity: 0, duration: 0.2, ease: 'power2.in' }, 0);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop with blur */}
            <div
                ref={backdropRef}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
                aria-hidden="true"
            />

            {/* Modal Content */}
            <div
                ref={modalRef}
                className={`bg-white rounded-2xl shadow-2xl w-full relative z-10 flex flex-col max-h-[90vh] ${sizeClasses[size]} ${className}`}
                role="dialog"
                aria-modal="true"
            >
                {/* Header */}
                {(title || onClose) && (
                    <div className="flex items-center justify-between p-6 border-b border-gray-100">
                        {title && <h2 className="text-xl font-bold text-gray-800">{title}</h2>}
                        {onClose && (
                            <button
                                onClick={handleClose}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700 active:scale-95"
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

