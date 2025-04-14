// components/PermissionWrapper.tsx
"use client";
import { ReactNode } from "react";
import { usePermissions } from "@/hooks/usePermissions";

interface PermissionWrapperProps {
    children: ReactNode;
    permission: string | string[];
    mode?: 'hide' | 'disable';
}

export const PermissionWrapper = ({
    children,
    permission,
    mode = 'hide'
}: PermissionWrapperProps) => {
    const { hasPermission } = usePermissions();

    if (!hasPermission(permission)) {
        return null;
    }

    return (
        <div className={mode === 'disable' ? 'opacity-50 cursor-not-allowed' : ''}>
            {children}
        </div>
    );
};