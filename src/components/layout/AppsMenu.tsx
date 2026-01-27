import React, { useState } from 'react';
import { Grip } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const PRODUCTS = [
    { name: 'Project Management', icon: '📊', color: 'bg-blue-100 text-blue-600', href: 'https://teslead-connect-dashboard.vercel.app/' },
    { name: 'Delivery Challan', icon: '👥', color: 'bg-purple-100 text-purple-600', href: 'https://dc-revamp-sathishs-projects-ffe2678a.vercel.app/' },
    { name: 'Insert Room', icon: '💬', color: 'bg-green-100 text-green-600', href: 'https://room.teslead.com' },
    // { name: 'Documents', icon: '📄', color: 'bg-yellow-100 text-yellow-600', href: 'https://docs.teslead.com' },
    // { name: 'Calendar', icon: '📅', color: 'bg-red-100 text-red-600', href: 'https://calendar.teslead.com' },
    // { name: 'Analytics', icon: '📈', color: 'bg-indigo-100 text-indigo-600', href: 'https://analytics.teslead.com' },
];

export function AppsMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    // Close on click outside (simplified, could be improved with useOnClickOutside)
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('#apps-menu-container')) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('click', handleClickOutside);
        }
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div id="apps-menu-container" className="relative group">
            <button
                onClick={() => setIsOpen(!isOpen)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={cn(
                    "p-2 rounded-lg transition-all active:scale-95 outline-none relative w-10 h-10 flex items-center justify-center",
                    isOpen || isHovered ? "bg-blue-50" : "hover:bg-gray-50 bg-white"
                )}
                title="Teslead Apps"
            >
                <div className="relative w-6 h-6 flex items-center justify-center">
                    {/* Static Icon (Visible when NOT hovered) */}
                    <div
                        className={cn(
                            "absolute inset-0 flex items-center justify-center transition-opacity duration-200",
                            isHovered ? "opacity-0" : "opacity-100"
                        )}
                    >
                        <Grip className="w-6 h-6 text-gray-500" />
                    </div>

                    {/* Animated GIF (Visible when hovered) */}
                    <div
                        className={cn(
                            "absolute inset-0 flex items-center justify-center transition-opacity duration-200",
                            isHovered ? "opacity-100" : "opacity-0"
                        )}
                    >
                        <img
                            src="/icons/apps.gif"
                            alt="Apps"
                            className="w-full h-full object-contain"
                        />
                    </div>
                </div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 p-4"
                    >
                        <div className="grid grid-cols-3 gap-4">
                            {PRODUCTS.map((product, index) => (
                                <a
                                    key={index}
                                    href={product.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-gray-50 transition-colors group/item"
                                >
                                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-xl mb-2 transition-transform group-hover/item:scale-110", product.color)}>
                                        {product.icon}
                                    </div>
                                    <span className="text-xs font-medium text-gray-600 text-center leading-tight">
                                        {product.name}
                                    </span>
                                </a>
                            ))}
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-100 text-center">
                            <button className="text-xs font-semibold text-blue-600 hover:underline">
                                More from Teslead
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
