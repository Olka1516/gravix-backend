import PlayList from "@/entities/PlayList.entity";
import UserEntity from "@/entities/User.entity";
import { EResponseMessage, EVisibility } from "@/types/enums";
import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";

export const createPlayList = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, visibility } = req.body;

    if (!req.user?.id) {
      res.status(401).json({ message: EResponseMessage.INVALID_CREDENTIALS });
      return;
    }

    const ownerID = req.user.id;

    const newPlayList = await PlayList.create({
      _id: new mongoose.Types.ObjectId(),
      ownerID,
      name,
      visibility,
    });

    res.status(201).json(newPlayList);
  } catch (error) {
    next(error);
  }
};

export const getMyPlayLists = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: EResponseMessage.INVALID_CREDENTIALS });
      return;
    }
    const ownerID = req.user.id;
    const playlists = await PlayList.find({ ownerID }).populate("song");
    if (!playlists) {
      res.status(404).json({ message: EResponseMessage.PLAYLIST_NOT_FOUND });
      return;
    }

    res.status(200).json(playlists);
  } catch (error) {
    next(error);
  }
};

export const addSongToPlaylist = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { songId, playlistId } = req.query;

    if (
      !songId ||
      typeof songId !== "string" ||
      !playlistId ||
      typeof playlistId !== "string"
    ) {
      res.status(400).json({ message: EResponseMessage.INVALID_CREDENTIALS });
      return;
    }

    const playlist = await PlayList.findById(playlistId);

    if (!playlist) {
      res.status(404).json({ message: "Playlist not found" });
      return;
    }

    if (!playlist.song.includes(new mongoose.Types.ObjectId(songId))) {
      playlist.song.push(new mongoose.Types.ObjectId(songId));
      await playlist.save();
    }

    res.status(200).json({ message: "Song added successfully", playlist });
  } catch (error) {
    next(error);
  }
};

export const getMyPlayList = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: EResponseMessage.INVALID_CREDENTIALS });
      return;
    }
    const ownerID = req.user.id;
    const { id } = req.params;
    const playlist = await PlayList.find({ ownerID, _id: id }).populate("song");
    if (!playlist) {
      res.status(404).json({ message: EResponseMessage.PLAYLIST_NOT_FOUND });
      return;
    }

    res.status(200).json(playlist);
  } catch (error) {
    next(error);
  }
};

export const getPublicPlaylists = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username } = req.params;

    const user = await UserEntity.findOne({ username });

    if (!user) {
      res.status(404).json({ message: EResponseMessage.USER_NOT_FOUND });
      return;
    }

    const playlists = await PlayList.find({
      ownerID: user.id,
      visibility: EVisibility.PUBLIC,
    }).populate("song");

    if (!playlists || playlists.length === 0) {
      res.status(404).json({ message: EResponseMessage.PLAYLIST_NOT_FOUND });
      return;
    }

    res.status(200).json(playlists);
  } catch (error) {
    next(error);
  }
};

export const getPublicPlaylistById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const playlists = await PlayList.find({
      _id: id,
      visibility: EVisibility.PUBLIC,
    }).populate("song");

    if (!playlists || playlists.length === 0) {
      res.status(404).json({ message: EResponseMessage.PLAYLIST_NOT_FOUND });
      return;
    }

    res.status(200).json(playlists);
  } catch (error) {
    next(error);
  }
};

export const deletePlayList = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const playlistId = req.params.id;
    if (!req.user?.id) {
      res.status(401).json({ message: EResponseMessage.INVALID_CREDENTIALS });
      return;
    }
    const ownerID = req.user.id;

    const deleted = await PlayList.findOneAndDelete({
      _id: playlistId,
      ownerID,
    });

    if (!deleted) {
      res.status(404).json({ message: EResponseMessage.PLAYLIST_NOT_FOUND });
      return;
    }

    res.status(200).json(deleted._id);
  } catch (error) {
    next(error);
  }
};

export const updatePlayList = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const playlistId = req.params.id;

    if (!req.user?.id) {
      res.status(401).json({ message: EResponseMessage.INVALID_CREDENTIALS });
      return;
    }

    const ownerID = req.user.id;
    const { name, visibility, songs } = req.body;

    const updateData: Partial<{
      name: string;
      visibility: EVisibility;
      song: string[];
    }> = {};

    if (typeof name === "string" && name.trim() !== "") {
      updateData.name = name.trim();
    }

    if (Object.values(EVisibility).includes(visibility)) {
      updateData.visibility = visibility;
    }

    if (Array.isArray(songs)) {
      updateData.song = songs;
    }

    const updated = await PlayList.findOneAndUpdate(
      { _id: playlistId, ownerID },
      updateData,
      { new: true }
    ).populate("song");

    if (!updated) {
      res.status(404).json({ message: EResponseMessage.PLAYLIST_NOT_FOUND });
      return;
    }

    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

export const patchLike = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: EResponseMessage.INVALID_CREDENTIALS });
      return;
    }

    const { id } = req.params;

    const song = await PlayList.findById(id);

    if (!song) {
      res.status(404).json({ message: EResponseMessage.PLAYLIST_NOT_FOUND });
      return;
    }

    if (song.likes.includes(userId)) {
      res
        .status(400)
        .json({ message: EResponseMessage.PLAYLIST_ALREADY_LIKED });
      return;
    }

    const updatedPlayList = await PlayList.findByIdAndUpdate(
      id,
      { $addToSet: { likes: userId } },
      { new: true }
    );

    res.status(200).json(updatedPlayList);
  } catch (error) {
    next(error);
  }
};

export const patchDislike = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: EResponseMessage.INVALID_CREDENTIALS });
      return;
    }

    const { id } = req.params;

    const song = await PlayList.findById(id);

    if (!song) {
      res.status(404).json({ message: EResponseMessage.PLAYLIST_NOT_FOUND });
      return;
    }

    if (!song.likes.includes(userId)) {
      res.status(400).json({ message: EResponseMessage.PLAYLIST_NOT_LIKED });
      return;
    }

    const updatedPlayList = await PlayList.findByIdAndUpdate(
      id,
      { $pull: { likes: userId } },
      { new: true }
    );

    res.status(200).json(updatedPlayList);
  } catch (error) {
    next(error);
  }
};
