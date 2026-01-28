// fe/src/services/kioskApi.ts

import { apiRequest } from './apiClient';

export type Host = {
  id: string;
  name: string;
  email: string;
  department: string | null;
  // /kiosk/hosts may not return this (since it returns only active hosts)
  is_active?: boolean;
};

export type PrintBadgePayload = {
  first_name: string;
  last_name: string;
  full_name: string;
  reason_for_visit: string;
  host_name: string;
  host_email?: string;
  timestamp: string;
  photo: string; // base64 data URL
};

export async function kioskHosts() {
  return apiRequest<Host[]>({ path: '/kiosk/hosts', kiosk: true });
}

export async function kioskPrintBadge(body: PrintBadgePayload) {
  return apiRequest<{
    success: boolean;
    visitor_id: string;
    badge_code: string;
    message?: string;
  }>({
    method: 'POST',
    path: '/kiosk/print-badge',
    kiosk: true,
    body,
  });
}

export async function kioskCheckOut(badge_code: string) {
  return apiRequest<{
    success: boolean;
    message?: string;
    visitor?: {
      id: string;
      badge_code: string;
      full_name: string;
      host_name: string | null;
      check_in_time: string;
      check_out_time: string | null;
    };
  }>({
    method: 'PATCH',
    path: '/kiosk/check-out',
    kiosk: true,
    body: { badge_code },
  });
}

/**
 * ✅ Backward-compatible exports to match your current component imports:
 * - BadgePreview.tsx imports `printBadge`
 * - CheckOutPanel.tsx imports `checkOutByCode`
 */
export const printBadge = kioskPrintBadge;
export const checkOutByCode = kioskCheckOut;
