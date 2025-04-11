import { SideNavItemGroup } from "@/types/types";
import { BsHouseDoor, BsKanban } from "react-icons/bs";
import { FaFileSignature } from "react-icons/fa";



export const SIDENAV_ITEMS: SideNavItemGroup[] = [

    {
        title: "Inicio",
        menuList: [{
            title: 'Inicio',
            path: '/dashboard',
            icon: <BsHouseDoor size={20} />,
        }]
    },
    {
        title: "Informes",
        menuList: [
            {
                title: 'Pre Catastro',
                path: '/dashboard/precatastral',
                icon: <FaFileSignature size={20} />,
                // submenu: true,
                // subMenuItems: [
                //     { title: 'Todo', path: '/dashboard/precatastral' },
                //     { title: 'Nuevo', path: '/dashboard/precatastral/new' },
                // ],
            },
            {
                title: 'Actas',
                path: '/dashboard/act',
                icon: <FaFileSignature size={20} />,
                // submenu: true,
                // subMenuItems: [
                //     { title: 'Todo', path: '/dashboard/acts' },
                //     { title: 'Nuevo', path: '/dashboard/acts/new' },
                // ],
            }
        ]
    }
];