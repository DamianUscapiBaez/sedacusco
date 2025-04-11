import { SideNavItemGroup } from "@/types/types";
import { BsHouseDoor } from "react-icons/bs";
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
                icon: <FaFileSignature size={20} />
            },
            {
                title: 'Actas',
                path: '/dashboard/act',
                icon: <FaFileSignature size={20} />
            }
        ]
    }
];