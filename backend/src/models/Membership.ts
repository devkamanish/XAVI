import mongoose, { Schema, Document } from "mongoose";

export type Role = "admin" | "manager" | "developer";

export interface IMembership extends Document {
  user: mongoose.Types.ObjectId;
  organization: mongoose.Types.ObjectId;
  role: Role;
  status: "active" | "invited";
  createdAt: Date;
  updatedAt: Date;
}

const membershipSchema = new Schema<IMembership>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "manager", "developer"],
      default: "developer",
    },
    status: {
      type: String,
      enum: ["active", "invited"],
      default: "active",
    },
  },
  { timestamps: true }
);

// One user can only have one membership per organization
membershipSchema.index({ user: 1, organization: 1 }, { unique: true });

export default mongoose.model<IMembership>("Membership", membershipSchema);
