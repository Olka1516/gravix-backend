import mongoose from "mongoose";

const SongSchema = new mongoose.Schema({
  _id: { type: mongoose.Types.ObjectId, required: true },
  title: { type: String, required: true },
  description: { type: String, required: false },
  lyrics: { type: String, required: false },
  image: { type: String, default: null },
  song: { type: String, required: false, default: "" },
  genres: { type: [String], required: true },
  author: { type: String, required: true },
  authorID: { type: String, required: true },
  duration: { type: String, required: true },
  releaseYear: { type: String, required: true },
  rating: { type: Number, default: 0 },
  likes: { type: [String], default: [] },
});

const Song = mongoose.model("Song", SongSchema);
export default Song;
