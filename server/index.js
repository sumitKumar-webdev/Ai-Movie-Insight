import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.routes.js";
import movieRoutes from "./routes/movie.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import { connectToDatabase } from "./lib/db.js";
import cookieParser from 'cookie-parser';

const app = express();
const port = Number(process.env.PORT || 5000);

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 }));

app.use("/api/auth", authRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/reviews", reviewRoutes);

app.use((error, _req, res, _next) => {
  const message = error instanceof Error ? error.message : "Internal server error";
  res.status(500).json({ error: message });
});

connectToDatabase()
  .then((connection) => {
    console.log(
      `MongoDB connected: ${connection.name || "unknown"} (${connection.host || "unknown-host"})`,
    );
    app.listen(port, () => {
      console.log(`Server listening on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });
