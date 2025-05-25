import {
  getAllUsers,
  getProfile,
  getUserByUsername,
  login,
  register,
  saveUserAnswers,
  sendMessage,
  updateSubscribers,
  updateUsesrPhoto,
} from "@/controllers/user.controller";
import authMiddleware from "@/middlewares/auth.middleware";
import { Router } from "express";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/interests", authMiddleware, saveUserAnswers);
router.post("/update/subscribers", authMiddleware, updateSubscribers);
router.put("/update/photo", authMiddleware, updateUsesrPhoto);
router.get("/info/:username", authMiddleware, getUserByUsername);
router.get("/all", authMiddleware, getAllUsers);
router.get("/profile", authMiddleware, getProfile);
router.post("/send", sendMessage);

export default router;
