// menu_constants.ts
import { SideNavItemGroup } from "@/types/types";
import { BsHouseDoor } from "react-icons/bs";
import { TbReportAnalytics } from "react-icons/tb";
import { LuUserRoundCog, LuWarehouse } from "react-icons/lu";
import { PiUsersThree } from "react-icons/pi";
import { CiBoxes } from "react-icons/ci";
import { MdOutlineEngineering } from "react-icons/md";
import { HiOutlineClipboardDocumentList } from "react-icons/hi2";

export const FULL_MENU: SideNavItemGroup[] = [
    {
        title: "Inicio",
        menuList: [{
            title: 'Inicio',
            path: '/dashboard',
            icon: <BsHouseDoor size={20} />,
            permission: null // No requiere permiso
        }]
    },
    {
        title: "Gestionar Usuarios",
        menuList: [
            {
                title: 'Roles',
                path: '/dashboard/role',
                icon: <LuUserRoundCog size={20} />,
                permission: 'roles.manage' // Permiso requerido
            },
            {
                title: 'Usuarios',
                path: '/dashboard/user',
                icon: <PiUsersThree size={20} />,
                permission: 'users.manage' // Permiso requerido
            }
        ]
    },
    {
        title: "Gestionar Almacen",
        menuList: [
            {
                title: 'Lotes',
                path: '/dashboard/lot',
                icon: <CiBoxes size={20} />,
                permission: 'lots.manage' // Permiso requerido
            },
            {
                title: 'Rotulado',
                path: '/dashboard/labeled',
                icon: <LuWarehouse size={20} />,
                permission: 'labeled.manage' // Permiso requerido
            }
        ]
    },
    {
        title: "Gestionar Documentos",
        menuList: [
            {
                title: 'Tecnicos',
                path: '/dashboard/technician',
                icon: <MdOutlineEngineering size={20} />,
                permission: 'technician.manage' // Permiso requerido
            },
            {
                title: 'Pre Catastros',
                path: '/dashboard/precatastral',
                icon: <HiOutlineClipboardDocumentList size={20} />,
                permission: 'precatastral.manage' // Permiso requerido
            },
            {
                title: 'Actas',
                path: '/dashboard/act',
                icon: <HiOutlineClipboardDocumentList size={20} />,
                permission: 'acts.manage' // Permiso requerido
            }
        ]
    },
    {
        title: "Reportes",
        menuList: [
            {
                title: 'Reporte',
                path: '/dashboard/precatastral',
                icon: <TbReportAnalytics size={20} />,
                permission: 'reports.generate' // Permiso requerido
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