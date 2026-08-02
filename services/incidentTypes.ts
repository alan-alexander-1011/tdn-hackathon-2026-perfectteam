// Single source of truth for the 4 report categories. Used by the report
// form, the map markers/legend, and the admin proposal grouping labels.
export type IncidentType = 'environment' | 'infrastructure' | 'utilities' | 'safety';

export interface IncidentTypeMeta {
  label: string;
  description: string;
  icon: string;
  color: string; // hex, used for map pins + UI accents
}

export const INCIDENT_TYPES: Record<IncidentType, IncidentTypeMeta> = {
  environment: {
    label: 'Môi trường và vệ sinh',
    description: 'Rác thải, ô nhiễm, cống rãnh, cây xanh...',
    icon: '🧹',
    color: '#16a34a',
  },
  infrastructure: {
    label: 'Hạ tầng giao thông',
    description: 'Đường hỏng, ngập nước, kẹt xe, tai nạn...',
    icon: '🚧',
    color: '#f97316',
  },
  utilities: {
    label: 'Tiện ích công cộng',
    description: 'Đèn đường, biển báo, ghế đá, trạm xe buýt...',
    icon: '💡',
    color: '#2563eb',
  },
  safety: {
    label: 'Trật tự và an toàn',
    description: 'An ninh, trộm cắp, tụ tập gây rối...',
    icon: '🚨',
    color: '#dc2626',
  },
};

export const INCIDENT_TYPE_ORDER: IncidentType[] = [
  'environment',
  'infrastructure',
  'utilities',
  'safety',
];
