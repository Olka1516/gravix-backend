import { Request, Response, NextFunction } from "express";
import cloudinary from "../config/cloudinary";
import Song from "@/entities/Song.entity";
import { UploadedFile } from "express-fileupload";

type CloudinaryUploadResponse = {
  public_id: string;
  version: number;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  bytes: number;
  type: string;
  url: string;
  secure_url: string;
};

export const createSong = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      username,
      title,
      description,
      lyrics,
      genres,
      author,
      duration,
      releaseYear,
      rating,
      ratingCount,
    } = req.body;

    if (
      !req.files?.song ||
      !username ||
      !title ||
      !author ||
      !genres ||
      !duration ||
      !releaseYear
    ) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    // Завантажуємо пісню у Cloudinary
    let songFile = req.files.song as UploadedFile;
    const songUpload = await new Promise((resolve) => {
      cloudinary.uploader
        .upload_stream({ resource_type: "video" }, (error, uploadResult) => {
          return resolve(uploadResult);
        })
        .end(songFile.data);
    });

    // Якщо є обкладинка - завантажуємо
    let imageFile = req.files.image as UploadedFile;

    const imageUpload = await new Promise((resolve) => {
      cloudinary.uploader
        .upload_stream((error, uploadResult) => {
          return resolve(uploadResult);
        })
        .end(imageFile.data);
    });

    const imageUrl = imageUpload as CloudinaryUploadResponse;
    const songUrl = songUpload as CloudinaryUploadResponse;

    // Збереження в MongoDB
    const newSong = new Song({
      username,
      title,
      description,
      lyrics,
      image: imageUrl.secure_url,
      song: songUrl.secure_url,
      genres: JSON.parse(genres),
      author,
      duration,
      releaseYear,
      rating: rating ? Number(rating) : 0,
      ratingCount: ratingCount ? Number(ratingCount) : 0,
    });

    await newSong.save();

    res.status(201).json({
      message: "Song uploaded successfully",
      song: newSong,
    });
  } catch (error) {
    next(error);
  }
};
