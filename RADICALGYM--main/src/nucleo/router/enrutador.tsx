import { useEffect, useState, type ComponentType, type LazyExoticComponent } from 'react';
import type { UserRole } from '../tipos/gym';
import type { GymContextType } from '../contexto/GymContext';

/** Pestañas de la aplicación (mismos identificadores del frontend original + vistas por rol). */
export type NavTab =
  | 'dashboard' | 'members' | 'staff' | 'memberships' | 'nutrition' | 'physiotherapy' | 'appointments' | 'attendances'
  | 'store' | 'finance' | 'alerts' | 'trainers' | 'routines' | 'measurements' | 'spinning'
  | 'my_space' | 'my_plan' | 'my_diet' | 'my_reports' | 'my_physio';

/** Acciones globales que reciben las pantallas (las mismas props del App original). */
export interface PropsModulo {
  setActiveTab: (tab: NavTab) => void;
  onOpenNewMemberModal: () => void;
  onOpenQuickSaleModal: () => void;
  onOpenNewExpenseModal: () => void;
}

/** Definición que exporta el router de cada módulo. */
export interface RutaModulo {
  id: NavTab;
  titulo: string;
  codigo: string;
  grupo: 'cuenta' | 'gestion' | 'salud' | 'operativo';
  orden: number;
  roles: UserRole[];
  // Cada pantalla recibe PropsModulo y usa solo las que necesita
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  componente: LazyExoticComponent<ComponentType<any>> | ComponentType<any>;
  /** Número opcional que se muestra junto a la opción del menú */
  insignia?: (ctx: GymContextType) => number;
}

/** Enrutador por hash (#/members) sin dependencias externas. */
const tabActual = () => (window.location.hash.replace(/^#\/?/, '') || '') as NavTab | '';

export function useTabActual(): NavTab | '' {
  const [tab, setTab] = useState(tabActual);
  useEffect(() => {
    const cambio = () => setTab(tabActual());
    window.addEventListener('hashchange', cambio);
    return () => window.removeEventListener('hashchange', cambio);
  }, []);
  return tab;
}

export function navegar(tab: NavTab) {
  window.location.hash = `/${tab}`;
}
