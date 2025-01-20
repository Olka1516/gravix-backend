import {
  getAllPlayers,
  getProfile,
  getUserByNickname,
  login,
  register,
} from "@/controllers/user.controller";
import authMiddleware from "@/middlewares/auth.middleware";
import { Router } from "express";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/info/:nickname", authMiddleware, getUserByNickname);
router.get("/all", authMiddleware, getAllPlayers);
router.get("/profile", authMiddleware, getProfile);

export default router;
