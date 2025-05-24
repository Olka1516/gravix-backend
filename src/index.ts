import connectDB from "@/config/db";
import playlistRoutes from "@/routes/playlist.rotes";
import recommendationRoutes from "@/routes/recommendation.routes";
import refreshRoutes from "@/routes/refresh.routes";
import songRoutes from "@/routes/song.routes";
import userRoutes from "@/routes/user.routes";

import cors from "cors";
import dotenv from "dotenv";
import fileUpload from "express-fileupload";

import express, { Application, json, urlencoded } from "express";

dotenv.config();
const port = process.env.PORT || 8000;
const app: Application = express();
const devMode = process.env.MODE === "dev";

connectDB();

app.use(urlencoded({ extended: true }));
app.use(json());
app.use(fileUpload());

app.use(
  cors({
    origin: devMode
      ? ["http://localhost:5173", "http://localhost:4173"]
      : "https://gravix-frontend.vercel.app",
    methods: "GET,POST,PUT,DELETE,OPTIONS",
    allowedHeaders: "Content-Type,Authorization",
    credentials: true,
  })
);

app.use("/api/users", userRoutes);
app.use("/api/playlists", playlistRoutes);
app.use("/api/refresh", refreshRoutes);
app.use("/api/songs", songRoutes);
app.use("/api/recommendation", recommendationRoutes);

app.get("/", (req, res) => {
  res.status(200).json({ msg: "Server is up and running" });
});

const server = app.listen(port, () => {
  console.log(`Server is listening at port ${port}`);
});
