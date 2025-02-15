import {
  createSong,
  getSongById,
  getSongsByUsername,
} from "@/controllers/song.controller";
import authMiddleware from "@/middlewares/auth.middleware";
import { Router } from "express";

const router = Router();

router.post("/create", authMiddleware, createSong);
router.get("/all/:username", authMiddleware, getSongsByUsername);
router.get("/:id", authMiddleware, getSongById);

export default router;
