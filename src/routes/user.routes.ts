import {
  getAllUsers,
  getProfile,
  getUserByUsername,
  login,
  register,
} from "@/controllers/user.controller";
import authMiddleware from "@/middlewares/auth.middleware";
import { Router } from "express";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/info/:username", authMiddleware, getUserByUsername);
router.get("/all", authMiddleware, getAllUsers);
router.get("/profile", authMiddleware, getProfile);

export default router;
