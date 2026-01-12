'use client';

import React from 'react';
import { Button } from "@/components/ui/Button";
import Image from "next/image";

interface SocialLoginButtonProps {
    provider: 'google' | 'github';
    disabled?: boolean;
    
}

export function SocialLoginButton({ provider, disabled }: SocialLoginButtonProps) {

    const handleLogin = () => {
        // Redirect to Server-Side Login Route
        window.location.href = `/api/auth/login?connection=${provider === 'google' ? 'google-oauth2' : 'github'}`;
    };

    return (
        <div className="flex flex-col gap-2">
            <Button
                type="button"
                variant="secondary"
                className="w-full relative cursor-pointer py-2.5 rounded-xl border-gray-200 hover:bg-gray-300 hover:border-gray-300 transition-all duration-200"
                onClick={handleLogin}
                disabled={disabled}
            >
                <div className="flex items-center justify-center gap-2">
                    <Image
                        src={`/icons/${provider}.svg`}
                        alt={`${provider} logo`}
                        width={20}
                        height={20}
                        className="w-5 h-5"
                    />
                    <span className="font-medium text-gray-700">
                        {provider === 'google' ? 'Google' : 'GitHub'}
                    </span>
                </div>
            </Button>
        </div>
    );
}
