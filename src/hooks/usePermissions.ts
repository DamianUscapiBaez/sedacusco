// hooks/usePermissions.ts
import { useSession } from "next-auth/react";

export const usePermissions = () => {
    const { data: session } = useSession();

    const hasPermission = (permission: string | string[]) => {
        if (!session?.user?.permissions) return false;

        if (Array.isArray(permission)) {
            return permission.some(p => session.user.permissions.includes(p));
        }

        return session.user.permissions.includes(permission);
    };

    return { hasPermission };
};