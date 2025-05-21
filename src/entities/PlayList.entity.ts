import { EVisibility } from "@/types/enums";
import mongoose from "mongoose";

const PlayListSchema = new mongoose.Schema({
  _id: { type: mongoose.Types.ObjectId, required: true },
  ownerID: { type: String, required: true },
  name: { type: String, required: true },
  visibility: { type: String, enum: EVisibility, required: true },
  song: [{ type: mongoose.Schema.Types.ObjectId, ref: "Song" }],
  likes: { type: [String], default: [] },
});

const PlayList = mongoose.model("PlayList", PlayListSchema);
export default PlayList;
