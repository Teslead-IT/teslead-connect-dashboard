"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { useResetPassword, useForgotPassword } from "@/hooks/use-auth";
import { Loader } from "@/components/ui/Loader";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import gsap from "gsap";
import { useToast } from "@/components/ui/Toast";

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const toast = useToast();
    
    const [identifier, setIdentifier] = useState(searchParams.get("id") || "");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    // Cooldown state for resend functionality
    const COOLDOWN_SECONDS = 60;
    const [cooldown, setCooldown] = useState(0);
    const [isResending, setIsResending] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const formRef = useRef<HTMLDivElement>(null);
    const hasAnimated = useRef(false);

    const { mutate: resetPassword, isPending: isResetting } = useResetPassword();
    const { mutate: resendResetCode } = useForgotPassword();

    // Auto update identifier if it comes from URL later
    useEffect(() => {
        const idParam = searchParams.get("id");
        if (idParam && !identifier) {
            setIdentifier(idParam);
        }
    }, [searchParams, identifier]);

    useEffect(() => {
        if (hasAnimated.current) return;
        hasAnimated.current = true;

        const ctx = gsap.context(() => {
            gsap.fromTo(formRef.current,
                { y: 50, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", delay: 0.1 }
            );
        }, containerRef);
        return () => ctx.revert();
    }, []);

    // Handle Cooldown Timer
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (cooldown > 0) {
            timer = setInterval(() => {
                setCooldown((prev) => prev - 1);
            }, 1000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [cooldown]);

    const handleResendOTP = (e: React.MouseEvent) => {
        e.preventDefault();
        
        if (!identifier.trim()) {
            toast.error("Account identifier is missing.");
            return;
        }

        if (cooldown > 0) return;

        setIsResending(true);
        const toastId = toast.loading("Resending code...");

        resendResetCode(identifier, {
            onSuccess: () => {
                toast.success("New reset code has been sent.", undefined, { id: toastId });
                setCooldown(COOLDOWN_SECONDS);
                setIsResending(false);
            },
            onError: () => {
                toast.error("Failed to resend code.", undefined, { id: toastId });
                setIsResending(false);
            }
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!identifier.trim()) {
            toast.error("Account identifier is missing.");
            return;
        }

        if (!otp.trim()) {
            toast.error("Please enter the reset code.");
            return;
        }

        if (newPassword.length < 8) {
            toast.error("Password must be at least 8 characters long.");
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match.");
            return;
        }

        const toastId = toast.loading("Updating password...");

        resetPassword(
            { identifier, otp, newPassword },
            {
                onSuccess: () => {
                    toast.success("Password changed successfully!", undefined, { id: toastId, duration: 4000 });
                    // Provide a visual delay before redirecting
                    setTimeout(() => {
                        router.push("/auth/login");
                    }, 1000);
                },
                onError: (error: any) => {
                    // Try to show specific error from backend, otherwise generic
                    const errorMessage = error?.response?.data?.message || error?.message || "Invalid code or password reset failed";
                    toast.error(errorMessage, undefined, { id: toastId });
                }
            }
        );
    };

    return (
        <div ref={containerRef} className="min-h-screen w-full flex items-center justify-center bg-[#f8fafc] font-sans p-4 relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[100px] opacity-70"></div>
            <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[100px] opacity-70"></div>
            
            <div ref={formRef} className="w-full max-w-md bg-white p-8 sm:p-10 shadow-2xl relative z-10">
                <Link href="/auth/login" className="absolute top-6 left-6 text-gray-400 hover:text-blue-600 transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                
                <div className="text-center space-y-2 mt-8 mb-8">
                    <div className="flex justify-center mb-6">
                        <Image src="/logo/single-logo.png" alt="Logo" width={48} height={48} className="object-contain" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-blue-600">
                        Create New Password
                    </h1>
                    <p className="text-gray-500 text-sm px-2 mt-2 leading-relaxed">
                        Enter the 6-digit code we sent you along with your new password.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <div className="flex items-center justify-between mb-1.5 ml-1">
                            <label className="block text-sm font-semibold text-gray-700">
                                Reset Code (OTP)
                            </label>
                            <button
                                type="button"
                                onClick={handleResendOTP}
                                disabled={cooldown > 0 || isResending}
                                className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
                            >
                                {isResending ? "Sending..." : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Code"}
                            </button>
                        </div>
                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            maxLength={6}
                            className="w-full px-4 py-3 rounded-none bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-200 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/5 transition-all outline-none text-sm tracking-[0.5em] text-center font-mono font-bold"
                            placeholder="------"
                            required
                            disabled={isResetting}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-none bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-200 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/5 transition-all outline-none text-sm pr-12"
                                placeholder="••••••••"
                                required
                                disabled={isResetting}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors p-1"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={`w-full px-4 py-3 rounded-none bg-gray-50 text-gray-900 placeholder-gray-400 border ${
                                    confirmPassword && newPassword !== confirmPassword 
                                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/10" 
                                    : "border-gray-200 focus:border-blue-600 focus:ring-blue-600/5"
                                } focus:bg-white focus:ring-4 transition-all outline-none text-sm pr-12`}
                                placeholder="••••••••"
                                required
                                disabled={isResetting}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors p-1"
                            >
                                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        {confirmPassword && newPassword !== confirmPassword && (
                            <p className="text-red-500 text-xs mt-1.5 ml-1 font-medium">Passwords do not match</p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        className="w-full mt-2 cursor-pointer !bg-blue-600 !hover:bg-blue-700 text-white font-bold py-3.5 rounded-none shadow-xl shadow-blue-600/20 hover:shadow-blue-600/30 transition-all text-base tracking-wide"
                        disabled={isResetting || (newPassword !== confirmPassword && confirmPassword.length > 0)}
                    >
                        {isResetting ? (
                            <span className="flex items-center justify-center gap-2">
                                <Loader size={18} className="border-t-white" /> Resetting...
                            </span>
                        ) : "Reset Password"}
                    </Button>
                </form>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="h-screen w-full flex items-center justify-center bg-white">
                <Loader size={80} />
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
