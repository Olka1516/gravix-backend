import mongoose from "mongoose";

const SongSchema = new mongoose.Schema({
  username: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: false },
  lyrics: { type: String, required: false },
  image: { type: String, default: null },
  song: { type: String, required: false, default: "" },
  genres: { type: [String], required: true },
  author: { type: String, required: true },
  duration: { type: String, required: true },
  releaseYear: { type: String, required: true },
  rating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
});

const Song = mongoose.model("Song", SongSchema);
export default Song;
