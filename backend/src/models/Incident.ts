import mongoose, { Schema, Document } from "mongoose";

export type Severity = "critical" | "high" | "medium" | "low";
export type IncidentStatus = "open" | "in_progress" | "resolved" | "closed";

export interface IIncident extends Document {
  title: string;
  description: string;
  severity: Severity;
  status: IncidentStatus;
  tags: string[];
  assignee: mongoose.Types.ObjectId | null;
  reporter: mongoose.Types.ObjectId;
  organization: mongoose.Types.ObjectId;
  dueDate: Date | null;
  attachments: string[];
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const incidentSchema = new Schema<IIncident>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 200,
    },
    description: {
      type: String,
      default: "",
      maxlength: 5000,
    },
    severity: {
      type: String,
      enum: ["critical", "high", "medium", "low"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
    },
    tags: {
      type: [String],
      default: [],
    },
    assignee: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reporter: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    attachments: {
      type: [String],
      default: [],
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);


incidentSchema.index({ organization: 1, status: 1 });
incidentSchema.index({ organization: 1, severity: 1 });
incidentSchema.index({ organization: 1, assignee: 1 });
incidentSchema.index({ organization: 1, createdAt: -1 });

export default mongoose.model<IIncident>("Incident", incidentSchema);
