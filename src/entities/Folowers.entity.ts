import mongoose from "mongoose";

const FollowerSchema = new mongoose.Schema({
  follower: { type: String, required: true }, // хто підписався
  following: { type: String, required: true }, // на кого підписався
});

export default mongoose.model("Follower", FollowerSchema);
