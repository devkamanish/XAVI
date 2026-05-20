import { Router } from "express";
import { signup, login, refreshAccessToken, logout, getMe } from "../controllers/authController";
import { validate } from "../middleware/validate";
import { signupSchema, loginSchema } from "../validators/schemas";
import { authenticate } from "../middleware/auth";

const router = Router();

router.post("/signup", validate(signupSchema), signup);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", refreshAccessToken);
router.post("/logout", logout);
router.get("/me", authenticate, getMe);

export default router;
