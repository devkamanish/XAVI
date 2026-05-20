import { Router } from "express";
import {
  createIncident,
  getIncidents,
  getIncident,
  updateIncident,
  deleteIncident,
} from "../controllers/incidentController";
import { addComment, getComments, deleteComment } from "../controllers/commentController";
import { authenticate } from "../middleware/auth";
import { requireOrg, requireRole } from "../middleware/rbac";
import { validate, validateQuery } from "../middleware/validate";
import {
  createIncidentSchema,
  updateIncidentSchema,
  createCommentSchema,
  incidentQuerySchema,
} from "../validators/schemas";
import multer from "multer";
import path from "path";

// File upload config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const router = Router();

// All incident routes require auth + org context
router.use(authenticate, requireOrg);

// Incident CRUD
router.post("/", validate(createIncidentSchema), createIncident);
router.get("/", validateQuery(incidentQuerySchema), getIncidents);
router.get("/:id", getIncident);
router.patch("/:id", validate(updateIncidentSchema), updateIncident);
router.delete("/:id", requireRole("admin", "manager"), deleteIncident);

// File upload endpoint
router.post("/:id/upload", upload.array("files", 5), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    const filePaths = files.map((f) => `/uploads/${f.filename}`);

    const Incident = (await import("../models/Incident")).default;
    const incident = await Incident.findOneAndUpdate(
      { _id: req.params.id, organization: req.orgId },
      { $push: { attachments: { $each: filePaths } } },
      { new: true }
    );

    if (!incident) {
      return res.status(404).json({ success: false, message: "Incident not found" });
    }

    const Activity = (await import("../models/Activity")).default;
    await Activity.create({
      action: "incident_updated",
      details: `${req.user.name} attached ${files.length} file(s) to "${incident.title}"`,
      user: req.user._id,
      incident: incident._id,
      organization: req.orgId,
    });

    return res.json({ success: true, data: { attachments: filePaths } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Upload failed" });
  }
});

// Comment routes (nested under incidents)
router.post("/:incidentId/comments", validate(createCommentSchema), addComment);
router.get("/:incidentId/comments", getComments);
router.delete("/:incidentId/comments/:commentId", deleteComment);

export default router;
