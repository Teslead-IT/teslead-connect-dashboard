'use client';

import React, { useState } from 'react';
import { useUser, useChangePassword } from '@/hooks/use-auth';
import { Tabs, TabItem } from '@/components/ui/Tabs';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import {
    User,
    Shield,
    Bell,
    Key,
    Smartphone,
    Mail,
    Camera,
    Loader2,
    CheckCircle2,
    Eye,
    EyeOff,
    Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { Dialog } from '@/components/ui/Dialog';

const TABS: TabItem[] = [
    { id: 'profile', label: 'My Profile', icon: <User className="w-4 h-4" /> },
    { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
];

export default function AccountSettingsPage() {
    const { data: user } = useUser();
    const toast = useToast();
    const [activeTab, setActiveTab] = useState('profile');

    // Security Tab States
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const { mutate: changePassword, isPending: isChangingPassword } = useChangePassword();

    // 2FA States
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);
    const [show2FAConfirmation, setShow2FAConfirmation] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    // Modal Password States (separate from main form to avoid conflict if needed, or reuse)
    // For simplicity, reusing the same state variables as they are on the same page and likely serve the same purpose of "updating password"
    // However, if the user wants to type it fresh in the modal, we should probably clear them when opening the modal.

    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault();

        changePassword({ oldPassword: currentPassword, newPassword }, {
            onSuccess: () => {
                toast.success("Password updated successfully");
                setCurrentPassword('');
                setNewPassword('');
                // setConfirmPassword(''); // data not needed

                // If this was triggered from the 2FA flow
                if (showPasswordModal) {
                    setShowPasswordModal(false);
                    setIs2FAEnabled(true);
                    toast.success("Two-Factor Authentication enabled");
                }
            },
            onError: (error: any) => {
                toast.error(error?.response?.data?.message || "Failed to update password");
            }
        });
    };

    const handle2FAToggle = () => {
        if (is2FAEnabled) {
            // Logic to disable 2FA if needed, for now just toggle off
            setIs2FAEnabled(false);
            toast.info("Two-Factor Authentication disabled");
        } else {
            setShow2FAConfirmation(true);
        }
    };

    const handle2FAConfirm = () => {
        setShow2FAConfirmation(false);
        // Clear password fields for the modal
        setCurrentPassword('');
        setNewPassword('');
        setShowPasswordModal(true);
    };

    // const { mutate: updateProfile, isPending: isUpdatingProfile } = useUpdateProfile();
    const isUpdatingProfile = false;
    const [name, setName] = useState(user?.fullName || '');

    // Update local state when user data loads
    React.useEffect(() => {
        if (user?.fullName) setName(user.fullName);
    }, [user?.fullName]);

    const handleProfileUpdate = () => {
        // updateProfile({ name }, {
        //     onSuccess: () => {
        //         toast.success("Profile updated successfully");
        //     },
        //     onError: (error: any) => {
        //         toast.error(error?.response?.data?.message || "Failed to update profile");
        //     }
        // });
        toast.success("Profile update coming soon!");
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm min-h-[600px]">
            {/* Tabs Header */}
            <div className="px-6 pt-2 border-b border-gray-100 bg-gray-50/50">
                <Tabs
                    items={TABS}
                    activeTab={activeTab}
                    onChange={setActiveTab}
                    className="border-b-0 -mb-px"
                />
            </div>

            <div className="px-6 py-4">
                {activeTab === 'profile' && (
                    <div key={user?.id || 'loading'} className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Profile Header */}
                        <div className="flex items-start gap-8 pb-8 border-b border-gray-100">
                            <div className="relative group">
                                <Avatar
                                    src={user?.avatarUrl || undefined}
                                    name={user?.fullName || user?.email || 'User'}
                                    size="lg"
                                    className="w-32 h-32 text-4xl ring-4 ring-white shadow-md"
                                />
                                <button className="absolute bottom-2 right-2 p-2.5 bg-white rounded-full border border-gray-200 shadow-sm text-gray-500 hover:text-[#091590] hover:border-[#091590] transition-colors z-10">
                                    <Camera className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex-1 pt-4">
                                <h2 className="text-2xl font-bold text-gray-900">{user?.fullName || 'User'}</h2>
                                <p className="text-base text-gray-500 mb-4">{user?.email}</p>
                                <div className="flex items-center gap-3">
                                    <Badge variant="info" className="px-3 py-1 bg-blue-50 text-[#091590] border-blue-100 font-semibold uppercase text-xs tracking-wider">
                                        {user?.memberships?.[0]?.role || 'Owner'}
                                    </Badge>
                                    <Badge variant="success" className="px-3 py-1 bg-green-50 text-green-700 border-green-100 font-semibold uppercase text-xs tracking-wider">
                                        Verified
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {/* Profile Details Form */}
                        <div className="space-y-12">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-24 gap-y-12">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                                    <label className="text-sm font-bold text-gray-700 sm:w-32 flex-shrink-0">Full Name</label>
                                    <div className="relative group flex-1">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#091590] transition-colors" />
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#091590]/10 focus:border-[#091590] transition-all"
                                            placeholder="Enter your full name"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                                    <label className="text-sm font-bold text-gray-700 sm:w-32 flex-shrink-0">Email Address</label>
                                    <div className="relative group flex-1">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#091590] transition-colors" />
                                        <input
                                            type="email"
                                            defaultValue={user?.email}
                                            disabled
                                            className="w-full pl-12 pr-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed opacity-80"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-12">
                                <button
                                    onClick={handleProfileUpdate}
                                    disabled={isUpdatingProfile || !name}
                                    className="flex items-center gap-2 px-8 py-3 bg-[#091590] text-white text-sm font-bold rounded-xl hover:bg-[#071170] shadow-lg shadow-[#091590]/20 hover:shadow-[#091590]/30 transition-all hover:-translate-y-0.5 active:translate-y-0 focus:ring-4 focus:ring-[#091590]/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                                >
                                    {isUpdatingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'security' && (
                    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* 2FA Section (Mock) */}
                        <div className="pt-2 space-y-6">
                            <div className="flex items-center justify-between py-6 border-b border-gray-100">
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 bg-purple-50 rounded-xl text-purple-700">
                                        <Smartphone className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-semibold text-gray-900">Two-Factor Authentication</h3>
                                        <p className="text-sm text-gray-500">Secure your account with 2FA protection</p>
                                    </div>
                                </div>

                                <button
                                    onClick={handle2FAToggle}
                                    className={cn(
                                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#091590]",
                                        is2FAEnabled ? "bg-[#091590]" : "bg-gray-200"
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
                                            is2FAEnabled ? "translate-x-6" : "translate-x-1"
                                        )}
                                    />
                                </button>
                            </div>

                            <Dialog
                                isOpen={show2FAConfirmation}
                                onClose={() => setShow2FAConfirmation(false)}
                                title="Two-Factor Authentication"
                                message="Are you On the 2-Factor aunthentications"
                                type="confirmation"
                                confirmText="Yes"
                                onConfirm={handle2FAConfirm}
                            >
                                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-3">
                                    <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-blue-200/90 leading-relaxed">
                                        When you sign in with Google or GitHub, you authorize the application to securely access your account through their trusted authentication system without sharing your actual password.
                                    </p>
                                </div>
                            </Dialog>

                            <Modal
                                isOpen={showPasswordModal}
                                onClose={() => setShowPasswordModal(false)}
                                title="Password"
                            >
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-sm text-gray-500">Update your password to keep your account secure</p>
                                    </div>

                                    <form onSubmit={handlePasswordChange} className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Current Password</label>
                                            <div className="relative">
                                                <input
                                                    type={showCurrentPassword ? "text" : "password"}
                                                    value={currentPassword}
                                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#091590]/20 focus:border-[#091590] transition-all pr-10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                                >
                                                    {showCurrentPassword ? (
                                                        <EyeOff className="w-4 h-4" />
                                                    ) : (
                                                        <Eye className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">New Password</label>
                                            <div className="relative">
                                                <input
                                                    type={showNewPassword ? "text" : "password"}
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#091590]/20 focus:border-[#091590] transition-all pr-10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                                >
                                                    {showNewPassword ? (
                                                        <EyeOff className="w-4 h-4" />
                                                    ) : (
                                                        <Eye className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex justify-end pt-2">
                                            <button
                                                type="submit"
                                                disabled={isChangingPassword || !currentPassword || !newPassword}
                                                className="flex items-center gap-2 px-6 py-2.5 bg-[#091590] text-white text-sm font-semibold rounded-lg hover:bg-[#071170] shadow-sm transition-all focus:ring-4 focus:ring-[#091590]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                                Update Password
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </Modal>
                        </div>
                    </div>
                )}

                {activeTab === 'notifications' && (
                    <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                        <div className="w-16 h-16 bg-blue-50 text-[#091590] rounded-xl flex items-center justify-center">
                            <Bell className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                Notification Preferences
                            </h3>
                            <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1">
                                Manage how you receive updates and alerts. Coming soon.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
}
