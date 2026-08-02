import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  type: 'accident' | 'flood' | 'traffic_jam';
  coordinates: {
    lat: number;
    lng: number;
  };
  note?: string;
  source: 'gps' | 'admin_pinpoint';
  timestamp: Date;
}

const ReportSchema = new Schema({
  type: {
    type: String,
    enum: ['accident', 'flood', 'traffic_jam'],
    required: true
  },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  note: { type: String },
  source: {
    type: String,
    enum: ['gps', 'admin_pinpoint'],
    default: 'gps',
  },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.models.Report || mongoose.model<IReport>('Report', ReportSchema);
