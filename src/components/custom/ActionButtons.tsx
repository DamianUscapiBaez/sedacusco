// components/ActionButtons.tsx
"use client";
import { Button } from "@/components/ui/button";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { usePermissions } from "@/hooks/usePermissions";

interface ActionButtonsProps {
    onEdit?: () => void;
    onDelete?: () => void;
    editPermission?: string;
    deletePermission?: string;
}

export const ActionButtons = ({
    onEdit,
    onDelete,
    editPermission = "update",
    deletePermission = "delete"
}: ActionButtonsProps) => {
    const { hasPermission } = usePermissions();

    return (
        <div className="flex justify-end gap-2">
            {onEdit && hasPermission(editPermission) && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onEdit}
                    aria-label="Editar"
                >
                    <FiEdit2 className="h-4 w-4 text-blue-500" />
                </Button>
            )}
            {onDelete && hasPermission(deletePermission) && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onDelete}
                    aria-label="Eliminar"
                >
                    <FiTrash2 className="h-4 w-4 text-red-500" />
                </Button>
            )}
        </div>
    );
};