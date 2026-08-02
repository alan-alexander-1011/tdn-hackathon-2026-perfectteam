import mongoose, { Schema, Document } from 'mongoose';

// The four report categories used across the app (report form, map pins,
// admin proposal grouping). Keep this list, INCIDENT_LABELS (services/incidentTypes.ts)
// and the Mongo enum below in sync if it ever changes.
export type IncidentType = 'environment' | 'infrastructure' | 'utilities' | 'safety';

export interface IReport extends Document {
  type: IncidentType;
  subType?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  note?: string;
  timestamp: Date;
}

const ReportSchema = new Schema({
  type: {
    type: String,
    enum: ['environment', 'infrastructure', 'utilities', 'safety'],
    required: true,
  },
  // Lựa chọn chi tiết trong nhóm sự cố (vd: 'flooding', 'road_damage'...) --
  // xem services/incidentTypes.ts. Không bắt buộc để tương thích với các báo
  // cáo cũ chưa có trường này.
  subType: { type: String },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  note: { type: String },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.models.Report || mongoose.model<IReport>('Report', ReportSchema);
