import { JSX } from "react";

export interface SideNavItem {
  title: string;
  path: string;
  icon: JSX.Element;
  permission: string | null; // Added permission property
  submenu?: boolean;
  subMenuItems?: { path: string; title: string }[];
}

export type SideNavItemGroup = {
  title: string;
  menuList: SideNavItem[]
}
export interface RoleData {
  id: number;
  name: string;
  description?: string;
}
export interface UserData {
  id: number;
  names: string;
  username: string;
  password: string;
  role: {
    id: number;
    name: string;
    description?: string;
  }
}
export interface TechnicianData {
  id: number;
  dni: string;
  name: string;
}
export interface ActData {
  id: number;
  file_number: string;
  file_date: string;
  created_at: string;
  created_by: string;
  reading: string;
  customer: {
    inscription: string;
    customer_name: string;
    old_meter: string;
    address: string;
  };
  meter: {
    meter_number: string;
    verification_code: string;
  };
  technician: {
    dni: string;
    name: string;
  };
  histories: ActHistory[]; // Array de objetos de historial
}
export interface ActHistory {
  id: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  updated_at: string; // Nota: corrected from 'update_at' to match Prisma model
  details?: string;
  user: {
    id: number;
    names: string;
    email?: string;
  };
}
export interface PreCatastralData {
  id: number;
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