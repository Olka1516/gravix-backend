import mongoose, { Schema } from "mongoose";
import { IUser } from "../types/entities";

const UserSchema: Schema = new Schema<IUser>({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  id: { type: String, required: true },
  avatar: { type: String, default: null },
  subscribers: { type: [String], default: [] }, // users who follow me
  following: { type: [String], default: [] }, // users I follow
  preferences: { type: [String], default: [] }, // favorites genres
});

export default mongoose.model<IUser & Document>("User", UserSchema);
