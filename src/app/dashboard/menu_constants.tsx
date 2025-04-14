// menu_constants.ts
import { SideNavItemGroup } from "@/types/types";
import { BsHouseDoor } from "react-icons/bs";
import { FaFileSignature, FaUserCog, FaUserFriends } from "react-icons/fa";
import { MdEngineering } from "react-icons/md";

export const FULL_MENU: SideNavItemGroup[] = [
    {
        title: "Inicio",
        menuList: [{
            title: 'Inicio',
            path: '/dashboard',
            icon: <BsHouseDoor size={20} />,
            permission: null // No requiere permiso
        }]
    }, {
        title: "Gestionar",
        menuList: [
            {
                title: 'Roles',
                path: '/dashboard/role',
                icon: <FaUserCog size={20} />,
                permission: 'roles.manage' // Permiso requerido
            },
            {
                title: 'Usuarios',
                path: '/dashboard/user',
                icon: <FaUserFriends size={20} />,
                permission: 'users.manage' // Permiso requerido
            },
            {
                title: 'Tecnicos',
                path: '/dashboard/technician',
                icon: <MdEngineering size={20} />,
                permission: 'technician.manage' // Permiso requerido
            }
        ]
    },
    {
        title: "Documentos",
        menuList: [
            {
                title: 'Pre Catastros',
                path: '/dashboard/precatastral',
                icon: <FaFileSignature size={20} />,
                permission: 'acts.manage' // Permiso requerido
            },
            {
                title: 'Actas',
                path: '/dashboard/act',
                icon: <FaFileSignature size={20} />,
                permission: 'precatastral.manage' // Permiso requerido
            }
        ]
    }
];

// Función optimizada para filtrar el menú
export const getFilteredMenu = (permissions: string[]): SideNavItemGroup[] => {
    return FULL_MENU.map(group => {
        const filteredMenuList = group.menuList.filter(item =>
            item.permission === null || permissions.includes(item.permission)
        );

        return filteredMenuList.length > 0
            ? { ...group, menuList: filteredMenuList }
            : null;
    }).filter(Boolean) as SideNavItemGroup[];
};