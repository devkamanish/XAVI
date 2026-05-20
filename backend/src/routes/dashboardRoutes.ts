import { Router } from "express";
import { getDashboardStats } from "../controllers/dashboardController";
import { authenticate } from "../middleware/auth";
import { requireOrg } from "../middleware/rbac";

const router = Router();

router.use(authenticate, requireOrg);

router.get("/stats", getDashboardStats);

export default router;
