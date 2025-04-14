// sidebar-menu-item.tsx
"use client";
import { useSideBarToggle } from '@/hooks/use-sidebar-toggle';
import { SideNavItem } from '@/types/types';
import classNames from 'classnames';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState, useMemo } from 'react'
import { BsChevronRight } from 'react-icons/bs';

export const SideBarMenuItem = ({ item }: { item: SideNavItem }) => {
    const { toggleCollapse } = useSideBarToggle();
    const pathname = usePathname();
    const [subMenuOpen, setSubMenuOpen] = useState(false);

    // Memoizar clases para evitar recálculos en cada render
    const { inactiveLink, activeLink, navMenuDropdownItem, dropdownMenuHeaderLink } = useMemo(() => ({
        inactiveLink: classNames(
            "flex items-center min-h-[40px] h-full text-sidebar-foreground py-2 px-4 hover:text-sidebar-muted-foreground hover:bg-sidebar-muted rounded-md transition duration-200"
        ),
        activeLink: classNames("active text-sidebar-muted-foreground bg-sidebar-muted"),
        navMenuDropdownItem: "text-red py-2 px-4 light:hover:text-black hover:text-sidebar-muted-foreground transition duration-200 rounded-md",
        dropdownMenuHeaderLink: classNames(
            "flex items-center min-h-[40px] h-full text-sidebar-foreground py-2 px-4 hover:text-sidebar-muted-foreground hover:bg-sidebar-muted rounded-md transition duration-200",
            {
                ["bg-sidebar-muted rounded-b-none"]: subMenuOpen
            }
        )
    }), [subMenuOpen]);

    const isActive = useMemo(() => pathname.includes(item.path), [pathname, item.path]);

    const toggleSubMenu = () => {
        setSubMenuOpen(!subMenuOpen);
    };

    return (
        <>
            {item.submenu ? (
                <div className="min-w-[18px]">
                    <a className={`${dropdownMenuHeaderLink} ${isActive ? activeLink : ''}`}
                        onClick={toggleSubMenu}>
                        {item.icon}
                        {!toggleCollapse && <>
                            <span className='ml-3 text-base leading-6 font-semibold'>{item.title}</span>
                            <BsChevronRight className={`${subMenuOpen ? 'rotate-90' : ''} ml-auto stroke-2 text-xs`} />
                        </>
                        }
                    </a>
                    {subMenuOpen && !toggleCollapse && (
                        <div className='bg-sidebar-muted border-l-4'>
                            <div className='grid gap-y-2 px-10 leading-5 py-3'>
                                {item.subMenuItems?.map((subItem: { path: string; title: string }, idx: number) => {
                                    return (
                                        <Link
                                            key={idx}
                                            href={subItem.path}
                                            className={`${navMenuDropdownItem} ${subItem.path === pathname ? 'text-white ' : 'text-sidebar-foreground'}`}
                                        >
                                            <span>{subItem.title}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>)
                    }
                </div>
            ) :
                (<Link href={item.path} className={`${inactiveLink} ${isActive ? activeLink : ''}`}>
                    {item.icon}
                    {!toggleCollapse && (<span className="ml-3 leading-6 font-semibold">{item.title}</span>)}
                </Link>)}
        </>
    );
};