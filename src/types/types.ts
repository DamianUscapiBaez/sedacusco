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

export interface PreCatastralData {
  id?: number;
  file_number: string;
  property: string;
  located_box: string;
  buried_connection: string;
  has_meter: string;
  reading: string;
  has_cover: string;
  cover_state: string;
  has_box: string;
  box_state: string;
  keys: string;
  cover_material: string;
  observations: string;
  is_located: string;
  customer_id: number;
  technician_id: number;
  created_at?: string | Date;
  
  // Relaciones
  customer?: {
    id: number;
    customer_name: string;
    address: string;
    inscription: string;
  };
  
  technician?: {
    id: number;
    name: string;
    dni: string;
  };
  
  histories?: Array<{
    id: number;
    action: string;
    details: string;
    created_at: string | Date;
    updated_by: number;
  }>;
}

export interface FetchParams {
  page?: number;
  limit?: number;
  file?: string;
  inscription?: string;
}