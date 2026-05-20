import mongoose, { Schema, Document } from "mongoose";

export interface IComment extends Document {
  content: string;
  author: mongoose.Types.ObjectId;
  incident: mongoose.Types.ObjectId;
  organization: mongoose.Types.ObjectId;
  mentions: string[]; // array of emails mentioned with @
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    incident: {
      type: Schema.Types.ObjectId,
      ref: "Incident",
      required: true,
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    mentions: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

commentSchema.index({ incident: 1, createdAt: -1 });

export default mongoose.model<IComment>("Comment", commentSchema);
