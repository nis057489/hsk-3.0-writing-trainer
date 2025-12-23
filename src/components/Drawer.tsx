import React, { useEffect } from "react";

interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
}

export function Drawer({ isOpen, onClose, children, title }: DrawerProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="drawer-backdrop open"
                onClick={onClose}
            />

            {/* Drawer Panel */}
            <div className="drawer open">
                <div className="drawer-header">
                    {title && <h2>{title}</h2>}
                    <button className="drawer-close" onClick={onClose}>
                        &times;
                    </button>
                </div>
                <div className="drawer-content">
                    {children}
                </div>
            </div>
        </>
    );
}
