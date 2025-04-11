'use client'
import React from 'react';
import { useSideBarToggle } from '@/hooks/use-sidebar-toggle';
import classNames from 'classnames';
import { SIDENAV_ITEMS } from '@/app/dashboard/menu_constants';
import SideBarMenuGroup from './sidebar-menu-group';

function Sidebar() {
    const { toggleCollapse } = useSideBarToggle();

    const asideStyle = classNames(
        "sidebar overflow-y-auto overflow-x-auto fixed bg-sidebar h-full shadow-sm shadow-slate-500/40 transition duration-300 ease-in-out z-[12]",
        {
            ["w-[20rem]"]: !toggleCollapse,
            ["sm:w-[5.4rem] sm:left-0 left-[-100%]"]: toggleCollapse,
        }
    );

    return (
        <aside className={asideStyle}>
            <div className="sidebar-top relative flex items-center px-3.5 py-5">
                <h3 className={classNames(
                    "pl-2 font-bold text-2xl min-w-max text-sidebar-foreground",
                    { hidden: toggleCollapse }
                )}>
                    Registros Seda
                </h3>
            </div>
            <nav className="flex flex-col gap-2 transition-all duration-700 ease-in-out">
                <div className="flex flex-col gap-2 px-4">
                    {SIDENAV_ITEMS.map((item, idx) => (
                        <SideBarMenuGroup key={idx} menuGroup={item} />
                    ))}
                </div>
            </nav>
        </aside>
    );
}

export default Sidebar;