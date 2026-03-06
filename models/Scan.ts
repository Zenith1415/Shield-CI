import mongoose, { Schema, Document, Model } from "mongoose"

export interface IScan extends Document {
  repo: string
  branch: string
  commit: string
  commitMessage: string
  status: "Clean" | "Issues Found" | "Failed"
  vulnsFound: number
  duration: string
  triggeredBy: string
  reportMarkdown?: string
  createdAt: Date
  updatedAt: Date
}

const ScanSchema: Schema = new Schema(
  {
    repo: { type: String, required: true, index: true },
    branch: { type: String, default: "main" },
    commit: { type: String, default: "" },
    commitMessage: { type: String, default: "" },
    status: { type: String, enum: ["Clean", "Issues Found", "Failed"], default: "Clean" },
    vulnsFound: { type: Number, default: 0 },
    duration: { type: String, default: "" },
    triggeredBy: { type: String, default: "PR" },
    reportMarkdown: { type: String },
  },
  { timestamps: true }
)

const Scan: Model<IScan> =
  mongoose.models.Scan || mongoose.model<IScan>("Scan", ScanSchema)

export default Scan
