// CRUD báo cáo dùng cho trang quản lý (/admin) -- thêm/xoá báo cáo thủ công.

import { IncidentType } from '@/services/incidentTypes';

export interface IncidentRecord {
  _id: string;
  type: IncidentType;
  subType?: string;
  coordinates: { lat: number; lng: number };
  note?: string;
  timestamp: string;
}

// GET /api/incidents
export async function listIncidents(): Promise<IncidentRecord[]> {
  const res = await fetch('/api/incidents');
  if (!res.ok) throw new Error('Không thể tải danh sách báo cáo');
  return res.json();
}

export interface NewIncidentPayload {
  type: IncidentType;
  subType?: string;
  coordinates: { lat: number; lng: number };
  note?: string;
}

// POST /api/incidents
export async function createIncident(payload: NewIncidentPayload): Promise<IncidentRecord> {
  const res = await fetch('/api/incidents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Không thể thêm báo cáo');
  return data;
}

// DELETE /api/incidents/:id
export async function deleteIncident(id: string): Promise<void> {
  const res = await fetch(`/api/incidents/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || 'Không thể xoá báo cáo');
  }
}
