'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ExpectedOutputModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (expectedOutput: string) => Promise<void> | void;
    taskTitle?: string;
    initialValue?: string;
    statusName?: string;
    statusColor?: string;
}

export function ExpectedOutputModal({
    isOpen,
    onClose,
    onConfirm,
    taskTitle,
    initialValue = '',
    statusName = 'Ready for testing',
    statusColor = '#9333ea',
}: ExpectedOutputModalProps) {
    const [expectedOutput, setExpectedOutput] = useState(initialValue);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setExpectedOutput(initialValue);
            setError(null);
            setIsSubmitting(false);
        }
    }, [isOpen, initialValue]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = expectedOutput.trim();
        if (!trimmed) {
            setError('Please enter the expected output criteria.');
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);
            await onConfirm(trimmed);
            onClose();
        } catch (err: any) {
            setError(err?.message || 'Failed to update expected output');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen || typeof document === 'undefined') return null;

    const themeColor = statusColor || '#9333ea';
    const bgLight = `${themeColor}18`;
    const borderLight = `${themeColor}35`;

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100"
                >
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        <div className="flex items-start gap-4">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-sm transition-colors"
                                style={{
                                    backgroundColor: bgLight,
                                    color: themeColor,
                                    borderColor: borderLight,
                                }}
                            >
                                <ClipboardCheck className="w-5 h-5" />
                            </div>
                            <div className="pr-6">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-base font-bold text-gray-900">Expected Output Required</h3>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    {taskTitle ? (
                                        <>
                                            Specify expected output for: <span className="font-semibold text-gray-700">"{taskTitle}"</span>
                                        </>
                                    ) : (
                                        `Please provide the expected output or test criteria before marking this task as ${statusName}.`
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-semibold text-gray-700">
                                Expected Output Criteria <span className="text-rose-500">*</span>
                            </label>
                            <textarea
                                value={expectedOutput}
                                onChange={(e) => {
                                    setExpectedOutput(e.target.value);
                                    if (error) setError(null);
                                }}
                                rows={4}
                                placeholder="e.g. User should see a green success alert with generated Order ID, and an email confirmation should be delivered to inbox."
                                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400 bg-gray-50 focus:bg-white text-gray-900"
                                style={{
                                    borderColor: error ? '#f43f5e' : undefined,
                                }}
                                autoFocus
                            />
                            {error && (
                                <p className="text-[11px] text-rose-600 font-medium">{error}</p>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={onClose}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-3.5 py-1.5 text-xs font-semibold text-white rounded-md transition-all shadow-sm hover:brightness-105 active:scale-[0.98] disabled:opacity-50"
                                style={{
                                    backgroundColor: themeColor,
                                    borderColor: themeColor,
                                }}
                            >
                                {isSubmitting ? 'Updating...' : `Set ${statusName}`}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
}
