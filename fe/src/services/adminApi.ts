// fe/src/services/adminApi.ts

import { apiRequest } from './apiClient';

export type DashboardStats = { todayVisitors: number; totalVisitors: number; activeHosts: number };

export type Host = {
  id: string;
  name: string;
  email: string;
  department: string | null;
  is_active: boolean;
};

export type VisitorLog = {
  id: string;
  full_name: string;
  reason_for_visit: string;
  host_name: string | null;
  check_in_time: string;
  check_out_time: string | null;
  badge_printed: boolean;
  notification_sent: boolean;
};

export type VisitorLogDetails = VisitorLog & {
  first_name: string;
  last_name: string;
  host_email: string | null;
  photo_url: string | null;      // base64 data URL in your current flow
  badge_code: string | null;     // if your entity has it
};

export async function getStats() {
  return apiRequest<DashboardStats>({ path: '/admin/stats', auth: true });
}

export async function listHosts() {
  return apiRequest<Host[]>({ path: '/admin/hosts', auth: true });
}

export async function createHost(data: { name: string; email: string; department?: string | null }) {
  return apiRequest<Host>({ method: 'POST', path: '/admin/hosts', auth: true, body: data });
}

export async function updateHost(id: string, data: { name: string; email: string; department?: string | null }) {
  return apiRequest<Host>({ method: 'PUT', path: `/admin/hosts/${id}`, auth: true, body: data });
}

export async function setHostActive(id: string, is_active: boolean) {
  return apiRequest<Host>({ method: 'PATCH', path: `/admin/hosts/${id}/active`, auth: true, body: { is_active } });
}

export async function deleteHost(id: string) {
  return apiRequest<{ success: true }>({ method: 'DELETE', path: `/admin/hosts/${id}`, auth: true });
}

export async function listVisitorLogs(search?: string) {
  const qs = search ? `?search=${encodeURIComponent(search)}&limit=100` : `?limit=100`;
  return apiRequest<VisitorLog[]>({ path: `/admin/visitor-logs${qs}`, auth: true });
}

export async function getVisitorLog(id: string) {
  return apiRequest<VisitorLogDetails>({ path: `/admin/visitor-logs/${id}`, auth: true });
}

export async function deleteVisitorLog(id: string) {
  return apiRequest<{ success: true }>({ method: 'DELETE', path: `/admin/visitor-logs/${id}`, auth: true });
}

// ✅ NEW: manual check-out (admin)
export async function checkOutVisitorLog(id: string) {
  return apiRequest<{
    success: true;
    visitor: VisitorLogDetails;
  }>({ method: 'PATCH', path: `/admin/visitor-logs/${id}/check-out`, auth: true });
}
