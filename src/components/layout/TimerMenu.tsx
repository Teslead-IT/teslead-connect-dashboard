'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Timer, FolderPlus, Clock, Square, Play, RefreshCw, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';

const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export function TimerMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Timer state
    const [isRunning, setIsRunning] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);

    // Confirmation state
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [taskName, setTaskName] = useState('');

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    // Handle trigger from other components
    useEffect(() => {
        const handleTrigger = (event: any) => {
            const name = event.detail?.taskName || '';
            setTaskName(name);
            setIsConfirmOpen(true);
        };

        window.addEventListener('trigger-timer', handleTrigger);
        return () => window.removeEventListener('trigger-timer', handleTrigger);
    }, []);

    const handleConfirmStart = () => {
        setIsRunning(true);
        setIsOpen(true);
        setIsConfirmOpen(false);
        // Smooth scroll to top to show the timer menu
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Timer effect
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRunning) {
            interval = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning]);

    // Update document title to show timer
    useEffect(() => {
        if (isRunning || elapsedTime > 0) {
            document.title = `Teslead Connect - ${formatTime(elapsedTime)}`;
        } else {
            document.title = 'Teslead Connect';
        }

        return () => {
            document.title = 'Teslead Connect';
        };
    }, [isRunning, elapsedTime]);

    const handleStart = () => setIsRunning(true);
    const handlePause = () => setIsRunning(false);
    const handleReset = () => {
        setIsRunning(false);
        setElapsedTime(0);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Timer Icon Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-1.5 p-2 rounded-lg cursor-pointer transition-all active:scale-95 ${isRunning || elapsedTime > 0
                    ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                    : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                title="Timer"
            >
                <Timer className="w-5 h-5" />
                {(isRunning || elapsedTime > 0) && (
                    <span className="text-xs font-semibold mr-1">{formatTime(elapsedTime)}</span>
                )}
            </button>

            {/* Dropdown Panel */}
            <div
                className={`absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-lg overflow-hidden z-[40] transition-all duration-200 ease-out origin-top-right transform ${isOpen
                    ? 'opacity-100 scale-100 translate-y-0'
                    : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                    }`}
            >
                <div className="p-4 flex flex-col items-center justify-center text-center">
                    <div className="mb-3 text-blue-500 bg-blue-50/50 p-2.5 rounded-full ring-4 ring-blue-50">
                        <Clock className="w-5 h-5" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 font-mono tracking-tight mb-4 mt-1">
                        {formatTime(elapsedTime)}
                    </h3>

                    <div className="w-full">
                        {isRunning ? (
                            <button
                                className="w-full flex items-center justify-center bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl py-2 px-3 transition-colors text-[11px] uppercase tracking-wider shadow-sm active:scale-95"
                                onClick={handleReset}
                            >
                                <Square className="w-3 h-3 mr-1.5" fill="currentColor" />
                                Stop Timer
                            </button>
                        ) : (
                            <button
                                className="w-full flex items-center justify-center bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-xl py-2 px-3 transition-colors text-[11px] uppercase tracking-wider shadow-sm active:scale-95"
                                onClick={handleStart}
                            >
                                <Play className="w-3 h-3 mr-1.5" fill="currentColor" />
                                Start Timer
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Confirmation Dialog */}
            <Dialog
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                type="info"
                title="Start Timer"
                message={`Are you sure you want to start the timer for "${taskName}"?`}
                confirmText="Start Timer"
                onConfirm={handleConfirmStart}
                onCancel={() => setIsConfirmOpen(false)}
            />
        </div>
    );
}
