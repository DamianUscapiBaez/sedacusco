import { JSX } from "react";

export type SideNavItem = {
  title: string;
  path: string;
  icon?: JSX.Element;
  submenu?: boolean;
  subMenuItems?: SideNavItem[];
};

export type SideNavItemGroup = {
  title: string;
  menuList: SideNavItem[]
}

export interface PreCatastral {
  id: number;
  file_number: string;
  property: string;
  created_at: string;
  customer: {
    inscription: string;
    customer_name: string;
    meter_number: string;
    address: string;
  };
  technician: {
    dni: string;
    name: string;
  };
}