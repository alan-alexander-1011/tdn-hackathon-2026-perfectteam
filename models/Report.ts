import mongoose, { Schema, Document } from 'mongoose';

// The four report categories used across the app (report form, map pins,
// admin proposal grouping). Keep this list, INCIDENT_LABELS (services/incidentTypes.ts)
// and the Mongo enum below in sync if it ever changes.
export type IncidentType = 'environment' | 'infrastructure' | 'utilities' | 'safety';

export interface IReport extends Document {
  type: IncidentType;
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
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  note: { type: String },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.models.Report || mongoose.model<IReport>('Report', ReportSchema);
