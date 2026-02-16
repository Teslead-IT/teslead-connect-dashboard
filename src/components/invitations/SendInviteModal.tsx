/**
 * Send Invite Modal Component
 * Slide-over panel for inviting users to organization with optional project assignment
 */

'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { X, Send, Mail, Building2, Shield } from 'lucide-react';
import { useSendInvite } from '@/hooks/use-invitations';
import { OrgRole, type SendInviteDto } from '@/types/invitation';
import { useUserSearch } from '@/hooks/use-user-search';
import { getInitials, getAvatarColor } from '@/lib/utils';

interface SendInviteModalProps {
    isOpen: boolean;
    onClose: () => void;
    orgId: string;
    orgName: string;
}

export function SendInviteModal({
    isOpen,
    onClose,
    orgId,
    orgName,
}: SendInviteModalProps) {
    const [mounted, setMounted] = useState(false);

    const [formData, setFormData] = useState<SendInviteDto>({
        email: '',
        orgRole: OrgRole.MEMBER,
    });

    const { mutate: sendInvite, isPending, isError, error, isSuccess, data, reset } = useSendInvite(orgId);

    // User Search Logic
    const [showSuggestions, setShowSuggestions] = useState(false);
    const { results: userSuggestions, isLoading: isSearching } = useUserSearch(formData.email);

    // Hide suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (!(e.target as Element).closest('.suggestions-container')) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Prevent body scroll when modal is open and reset state on close
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';

            // Reset form and mutation state when modal closes (after transition)
            const timer = setTimeout(() => {
                setFormData({
                    email: '',
                    orgRole: OrgRole.MEMBER,
                });
                reset();
            }, 300);
            return () => clearTimeout(timer);
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, reset]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate
        if (!formData.email) return;

        console.log(formData);

        sendInvite(formData, {
            onSuccess: (data) => {
                // If user is already in org, don't clear form and don't close modal automatically
                if (data?.message === "User already in our organization") {
                    return;
                }

                // Reset form
                setFormData({
                    email: '',
                    orgRole: OrgRole.MEMBER,
                });
                // Close modal after short delay
                setTimeout(onClose, 1500);
            },
        });
    };

    if (!mounted) return null;

    // Use Portal to render at document body level
    return createPortal(
        <div
            className={cn(
                "fixed inset-0 z-[100] flex justify-end pointer-events-none",
                !isOpen && "invisible"
            )}
        >
            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 pointer-events-auto",
                    isOpen ? "opacity-100" : "opacity-0"
                )}
            />

            {/* Slide-over Panel */}
            <div
                className={cn(
                    "pointer-events-auto relative w-full h-full max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-500 ease-out z-[101]",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Invite Members</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Invite users to <span className="font-medium text-gray-900">{orgName}</span></p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-gray-50/50">
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">

                        {/* Email Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => {
                                        setFormData({ ...formData, email: e.target.value });
                                        setShowSuggestions(true);
                                    }}
                                    onFocus={() => setShowSuggestions(true)}
                                    className="block w-full pl-10 pr-3 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#091590]/20 focus:border-[#091590] transition-all text-sm shadow-sm"
                                    placeholder="user@example.com"
                                    disabled={isPending}
                                    autoFocus
                                    autoComplete="off"
                                />

                                {/* User Suggestions Dropdown */}
                                {showSuggestions && formData.email.length > 1 && (
                                    <div className="suggestions-container absolute z-20 w-full mt-1 bg-white rounded-lg shadow-xl border border-gray-200 max-h-60 overflow-y-auto overflow-x-hidden">
                                        {isSearching ? (
                                            <div className="p-4 text-center text-sm text-gray-500 animate-pulse">
                                                Searching users...
                                            </div>
                                        ) : userSuggestions.length > 0 ? (
                                            <div className="py-1">
                                                {userSuggestions.map((user) => (
                                                    <div
                                                        key={user.id}
                                                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0"
                                                        onClick={() => {
                                                            setFormData({ ...formData, email: user.email });
                                                            setShowSuggestions(false);
                                                        }}
                                                    >
                                                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs text-white font-medium shadow-sm ${getAvatarColor(user.name)}`}>
                                                            {user.avatarUrl ? (
                                                                <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                                                            ) : (
                                                                getInitials(user.name)
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                                                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                                        </div>
                                                        <div className="text-xs text-gray-400">Select</div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Organization Role */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Organization Role</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Shield className="h-4 w-4 text-gray-400" />
                                </div>
                                <select
                                    value={formData.orgRole}
                                    onChange={(e) => setFormData({ ...formData, orgRole: e.target.value as OrgRole })}
                                    className="block w-full pl-10 pr-10 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#091590]/20 focus:border-[#091590] transition-all text-sm shadow-sm appearance-none"
                                    disabled={isPending}
                                >
                                    <option value={OrgRole.MEMBER}>Member</option>
                                    <option value={OrgRole.ADMIN}>Admin</option>
                                    <option value={OrgRole.OWNER}>Owner</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                            <p className="mt-1.5 text-xs text-gray-500">
                                {formData.orgRole === OrgRole.OWNER && 'Full access to organization settings'}
                                {formData.orgRole === OrgRole.ADMIN && 'Can manage projects and invite members'}
                                {formData.orgRole === OrgRole.MEMBER && 'Standard member access'}
                            </p>
                        </div>



                        {/* Success Message */}
                        {isSuccess && data?.message !== "User already in our organization" && (
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-green-800">Invitation Sent!</h4>
                                    <p className="text-xs text-green-600 mt-0.5">The user has been invited successfully.</p>
                                </div>
                            </div>
                        )}

                        {/* Already in Org Message */}
                        {isSuccess && data?.message === "User already in our organization" && (
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Building2 className="w-3 h-3 text-blue-600" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-blue-800">Already a Member</h4>
                                    <p className="text-xs text-blue-600 mt-0.5">{data.message}</p>
                                </div>
                            </div>
                        )}

                        {/* Error Message */}
                        {isError && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <X className="w-3 h-3 text-red-600" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-red-800">Failed to send</h4>
                                    <p className="text-xs text-red-600 mt-0.5">
                                        {(() => {
                                            const msg = (error as any)?.response?.data?.message || (error as Error)?.message || 'Something went wrong.';
                                            if (msg.includes("Only the organization creator can send invitations")) {
                                                return "Only the organization creator can invite members.";
                                            }
                                            return msg;
                                        })()}
                                    </p>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-white">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isPending}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isPending}
                        className="px-6 py-2 text-sm font-medium text-white bg-[#091590] rounded-lg hover:bg-[#071170] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center gap-2"
                    >
                        {isPending ? (
                            <>
                                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send className="w-3.5 h-3.5" />
                                Send Invite
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
