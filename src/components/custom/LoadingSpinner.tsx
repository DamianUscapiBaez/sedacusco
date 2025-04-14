// components/LoadingSpinner.tsx
import React from 'react';

interface LoadingSpinnerProps {
    fullPage?: boolean;
}

export default function LoadingSpinner({ fullPage = false }: LoadingSpinnerProps) {
    return (
        <div
            className={`flex items-center justify-center ${fullPage ? 'fixed inset-0 bg-white z-50' : 'py-4'
                }`}
        >
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-opacity-50" />
        </div>
    );
}
