import {
  addPlayListById,
  addSongToPlaylist,
  createPlayList,
  deletePlayList,
  deleteSongFromPlayList,
  getMyPlayList,
  getMyPlayLists,
  getPublicPlaylistById,
  getPublicPlaylists,
  patchDislike,
  patchLike,
  updatePlayList,
} from "@/controllers/playlist.controller";
import authMiddleware from "@/middlewares/auth.middleware";
import { Router } from "express";

const router = Router();

router.post("/create", authMiddleware, createPlayList);
router.post("/copy/:id", authMiddleware, addPlayListById);
router.get("/my", authMiddleware, getMyPlayLists);
router.get("/my/:id", authMiddleware, getMyPlayList);
router.get("/get/:username", authMiddleware, getPublicPlaylists);
router.get("/:id", authMiddleware, getPublicPlaylistById);
router.delete("/:id", authMiddleware, deletePlayList);
router.delete("/delete/song/", authMiddleware, deleteSongFromPlayList);
router.put("/update/:id", authMiddleware, updatePlayList);
router.put("/add/song", authMiddleware, addSongToPlaylist);
router.patch("/like/:id", authMiddleware, patchLike);
router.patch("/dislike/:id", authMiddleware, patchDislike);

export default router;
