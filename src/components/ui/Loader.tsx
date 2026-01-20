'use client';
import Lottie from 'lottie-react';
import loaderData from './loader-data.json';

interface LoaderProps {
    className?: string; // CSS class for container
    size?: number; // Size in pixels
}

export function Loader({ className, size = 80 }: LoaderProps) {
    return (
        <div
            className={`flex items-center justify-center ${className || ''}`}
            style={{ width: size, height: size }}
        >
            <Lottie
                animationData={loaderData}
                loop={true}
                autoplay={true}
                className="w-full h-full"
            />
        </div>
    );
}
