import mongoose, { Schema, Document } from "mongoose";

export interface IActivity extends Document {
  action: string;
  details: string;
  user: mongoose.Types.ObjectId;
  incident: mongoose.Types.ObjectId | null;
  organization: mongoose.Types.ObjectId;
  metadata: Record<string, any>;
  createdAt: Date;
}

const activitySchema = new Schema<IActivity>(
  {
    action: {
      type: String,
      required: true,
      // Examples: "incident_created", "status_changed", "severity_changed",
      // "assignee_changed", "comment_added", "incident_closed"
    },
    details: {
      type: String,
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    incident: {
      type: Schema.Types.ObjectId,
      ref: "Incident",
      default: null,
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

activitySchema.index({ organization: 1, createdAt: -1 });
activitySchema.index({ incident: 1, createdAt: -1 });

export default mongoose.model<IActivity>("Activity", activitySchema);
