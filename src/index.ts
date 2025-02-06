import connectDB from "@/config/db";
import refreshRoutes from "@/routes/refresh.routes";
import userRoutes from "@/routes/user.routes";
import songRoutes from "@/routes/song.routes";
import cors from "cors";
import dotenv from "dotenv";
import fileUpload from "express-fileupload";

import express, { Application, json, urlencoded } from "express";

dotenv.config();
const port = process.env.PORT || 8000;
const app: Application = express();

connectDB();

app.use(urlencoded({ extended: true }));
app.use(json());
app.use(cors());
app.use(fileUpload());

app.use("/api/users", userRoutes);
app.use("/api/refresh", refreshRoutes);
app.use("/api/songs", songRoutes);

app.get("/", (req, res) => {
  res.status(200).json({ msg: "Server is up and running" });
});

const server = app.listen(port, () => {
  console.log(`Server is listening at port ${port}`);
});
