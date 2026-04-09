"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { useForgotPassword } from "@/hooks/use-auth";
import { Loader } from "@/components/ui/Loader";
import { ArrowLeft } from "lucide-react";
import gsap from "gsap";
import { useToast } from "@/components/ui/Toast";

function ForgotPasswordContent() {
    const [identifier, setIdentifier] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const formRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const hasAnimated = useRef(false);
    const toast = useToast();

    const { mutate: requestReset, isPending: isLoading } = useForgotPassword();

    useEffect(() => {
        if (hasAnimated.current) return;
        hasAnimated.current = true;

        const ctx = gsap.context(() => {
            gsap.fromTo(formRef.current,
                { y: 50, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
            );
        }, containerRef);
        return () => ctx.revert();
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!identifier.trim()) {
            toast.error("Please enter your email, phone, or username");
            return;
        }

        const toastId = toast.loading("Sending reset code...");

        requestReset(identifier, {
            onSuccess: () => {
                toast.success("If the account exists, a reset code has been sent.", undefined, { id: toastId });
            },
            onError: () => {
                toast.error("Failed to send reset code. Please try again.", undefined, { id: toastId });
            }
        });
    };

    return (
        <div ref={containerRef} className="min-h-screen w-full flex items-center justify-center bg-[#f8fafc] font-sans p-4 relative overflow-hidden">
            {/* Background elements to match overall theme */}
            <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[100px] opacity-70"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[100px] opacity-70"></div>
            
            <div ref={formRef} className="w-full max-w-md bg-white p-8 sm:p-10 shadow-2xl relative z-10">
                <Link href="/auth/login" className="absolute top-6 left-6 text-gray-400 hover:text-blue-600 transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                
                <div className="text-center space-y-2 mt-8 mb-8">
                    <div className="flex justify-center mb-6">
                        <Image src="/logo/single-logo.png" alt="Logo" width={48} height={48} className="object-contain" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-blue-600">
                        Forgot Password?
                    </h1>
                    <p className="text-gray-500 text-sm px-2 mt-2 leading-relaxed">
                        Enter your email, phone, or username. We'll send you a recovery code to reset your password.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
                            Email, Phone, or Username
                        </label>
                        <input
                            type="text"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            className="w-full px-4 py-3 rounded-none bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-200 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/5 transition-all outline-none text-sm"
                            placeholder="Enter Your Email, Phone, or Username"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full cursor-pointer !bg-blue-600 !hover:bg-blue-700 text-white font-bold py-3.5 rounded-none shadow-xl shadow-blue-600/20 hover:shadow-blue-600/30 transition-all text-base tracking-wide"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <Loader size={18} className="border-t-white" /> Sending...
                            </span>
                        ) : "Send Reset Code"}
                    </Button>
                </form>
            </div>
        </div>
    );
}

export default function ForgotPasswordPage() {
    return (
        <Suspense fallback={
            <div className="h-screen w-full flex items-center justify-center bg-white">
                <Loader size={80} />
            </div>
        }>
            <ForgotPasswordContent />
        </Suspense>
    );
}
