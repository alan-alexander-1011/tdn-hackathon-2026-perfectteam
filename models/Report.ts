import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  type: 'accident' | 'flood' | 'traffic_jam';
  coordinates: {
    lat: number;
    lng: number;
  };
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
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.models.Report || mongoose.model<IReport>('Report', ReportSchema);
