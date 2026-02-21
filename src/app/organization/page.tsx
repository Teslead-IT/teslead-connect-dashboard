"use client";

import React, { useEffect, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser, useSwitchOrg } from "@/hooks/use-auth";
import { Loader } from "@/components/ui/Loader";
import { LogOut, ChevronRight, Building2, CheckCircle2, Video, FileText } from "lucide-react";
import { NotificationProvider } from "@/context/NotificationContext";
import { authApi } from "@/services/auth.service";
import { clearAuthTokens } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";

function OrganizationsPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const returnTo = searchParams.get('returnTo') || '/dashboard';

    const { data: user, isLoading: isUserLoading } = useUser();
    const { mutate: switchOrg, isPending: isSwitching } = useSwitchOrg();
    const queryClient = useQueryClient();

    // Redirect to login if no user
    useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace('/auth/login');
        }
    }, [user, isUserLoading, router]);

    const handleOrgSelect = (orgId: string) => {
        switchOrg(orgId, {
            onSuccess: () => {
                router.push(returnTo);
            }
        });
    };

    const handleLogout = async () => {
        queryClient.clear();
        clearAuthTokens();
        // Optional: Call backend logout if needed
        try {
            await authApi.logout();
        } catch (e) {
            // Ignore error
        }
        router.push('/auth/login');
    };

    if (isUserLoading || !user) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-white">
                <Loader size={200} />
            </div>
        );
    }

    const memberships = user.memberships || [];
    const displayName = user.name || user.username || user.email?.split('@')[0] || 'User';
    // Add null check or default if avatar doesn't exist on user type
    const displayAvatar = (user as any).avatarUrl || null;

    return (
        <div className="flex flex-col h-screen w-full bg-white text-gray-900 font-sans overflow-hidden">
            {/* Custom Header matching the dashboard TopNav styling */}
            <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0 sticky top-0 z-30">
                {/* Logo */}
                <div className="flex items-center gap-6 flex-1">
                    <div className="flex items-center gap-3">
                        <div className="bg-white border border-gray-200 shadow-sm p-1.5 rounded-lg">
                            <Image src="/logo/single-logo.png" alt="Teslead Logo" width={24} height={24} className="object-contain" />
                        </div>
                        <span className="text-lg font-bold tracking-tight text-gray-900 hidden sm:block">Teslead Connect</span>
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-4">
                    {/* User Profile */}
                    <div className="flex items-center gap-2.5 pl-1 group hover:bg-gray-50 p-1.5 rounded-xl transition-all cursor-pointer">
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-xs font-bold text-gray-900 group-hover:text-[#091590] transition-colors whitespace-nowrap">{displayName}</span>
                            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-tighter">USER</span>
                        </div>
                        <div className="relative shrink-0">
                            {displayAvatar ? (
                                <img src={displayAvatar} alt="Profile" className="w-8 h-8 rounded-lg object-cover ring-2 ring-transparent group-hover:ring-blue-50 transition-all shadow-sm" />
                            ) : (
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#091590] to-[#071170] flex items-center justify-center text-white font-black text-xs shadow-inner uppercase">
                                    {displayName.charAt(0)}
                                </div>
                            )}
                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
                        </div>
                    </div>

                    {/* Logout Button */}
                    <button onClick={handleLogout} className="flex items-center justify-center p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Sign out">
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                {/* Left Side - Greeting and Content */}
                <div className="w-full lg:w-1/2 p-8 lg:p-16 flex flex-col h-full bg-gray-50 border-r border-gray-200 relative overflow-y-auto lg:overflow-hidden">
                    {/* Greeting */}
                    <div className="mb-12 shrink-0">
                        <h1 className="text-4xl text-gray-700 font-light tracking-tight mb-2">
                            Hello, <span className="font-semibold text-gray-900">{displayName}</span>
                        </h1>
                        <p className="text-xl text-gray-500">
                            Welcome back to your organizations!
                        </p>
                    </div>

                    {/* Dashboard Feature Cards */}
                    <div className="space-y-4 max-w-lg flex-grow">
                        <div className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-6">
                            Explore Features
                        </div>

                        <div className="group p-5 rounded-2xl bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-300">
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-gray-900 mb-1">Manage Your Projects</h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">
                                        Organize tasks, track progress across phases, and collaborate seamlessly with your team.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="group p-5 rounded-2xl bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-300">
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
                                    <Video className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-gray-900 mb-1">Streamline Meetings</h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">
                                        Capture Minutes of Meeting (MOM), tag relevant projects, and notify team members instantly.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="group p-5 rounded-2xl bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-300">
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-gray-900 mb-1">Document Hub</h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">
                                        Centralize all your project-related documents and assets in one secure place.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Left */}
                    <div className="mt-8 pt-8 flex items-center justify-between text-sm text-gray-500 border-t border-gray-200 shrink-0">
                    </div>
                </div>

                {/* Right Side - Organizations List */}
                <div className="w-full lg:w-1/2 p-8 lg:p-16 flex flex-col relative overflow-y-auto bg-white">


                    <div className="max-w-xl w-full mx-auto lg:mt-24">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-lg font-medium text-gray-900">Your Organizations</h2>
                            <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                                {memberships.length} {memberships.length === 1 ? 'Organization' : 'Organizations'}
                            </span>
                        </div>

                        {memberships.length === 0 ? (
                            <div className="text-center py-16 px-6 bg-gray-50 rounded-2xl border border-gray-200 border-dashed">
                                <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No organizations found</h3>
                                <p className="text-sm text-gray-500">
                                    You don't belong to any organizations yet. Please contact your administrator.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {memberships.map((membership) => (
                                    <button
                                        key={membership.orgId}
                                        onClick={() => handleOrgSelect(membership.orgId)}
                                        disabled={isSwitching}
                                        className="w-full group flex items-center justify-between p-4 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm transition-all duration-200 text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-[#091590]/10 flex items-center justify-center border border-[#091590]/20 group-hover:bg-[#091590]/20 transition-colors">
                                                <span className="text-lg font-semibold text-[#091590]">
                                                    {membership.orgName.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900 mb-0.5">
                                                    {membership.orgName}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <span>{membership.slug || membership.orgId}</span>
                                                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                    <span className="uppercase font-medium">{membership.role}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-2 rounded-lg text-gray-400 group-hover:text-gray-600 group-hover:bg-gray-100 transition-colors">
                                            <ChevronRight className="w-5 h-5" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Global Loader Overlay when switching */}
                {isSwitching && (
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-50 flex items-center justify-center">
                        <Loader size={100} />
                    </div>
                )}
            </div>
        </div>
    );
}

export default function OrganizationsPage() {
    return (
        <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-white"><Loader size={200} /></div>}>
            <NotificationProvider>
                <OrganizationsPageContent />
            </NotificationProvider>
        </Suspense>
    );
}
