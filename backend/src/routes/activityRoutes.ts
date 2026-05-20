import { Router } from "express";
import { getActivities } from "../controllers/activityController";
import { authenticate } from "../middleware/auth";
import { requireOrg } from "../middleware/rbac";

const router = Router();

router.use(authenticate, requireOrg);

router.get("/", getActivities);

export default router;
