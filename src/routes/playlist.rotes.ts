import {
  createPlayList,
  deletePlayList,
  getMyPlayList,
  updatePlayList,
} from "@/controllers/playlist.controller";
import authMiddleware from "@/middlewares/auth.middleware";
import { Router } from "express";

const router = Router();

router.post("/create", authMiddleware, createPlayList);
router.get("/my", authMiddleware, getMyPlayList);
router.delete("/:id", authMiddleware, deletePlayList);
router.put("/update/:id", authMiddleware, updatePlayList);

export default router;
