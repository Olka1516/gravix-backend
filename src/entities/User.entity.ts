import mongoose, { Schema } from "mongoose";
import { IUser } from "../types/entities";

const UserSchema: Schema = new Schema<IUser>({
  nickname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  id: { type: String, required: true },
  avatar: { type: String, default: null },
});

export default mongoose.model<IUser & Document>("User", UserSchema);
