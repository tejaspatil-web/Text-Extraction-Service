import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import ocrRoutes from "./routes/ocr.routes.js";
import { setupSwagger } from "./config/swagger.js";
import { initWorkers } from "./services/ocr.service.js";

dotenv.config({quiet: true});

const app = express();
const port = process.env.PORT || 3000;

// CORS configuration
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS ? process.env.CORS_ALLOWED_ORIGINS.split(",") : [];

app.use(cors({
  origin: allowedOrigins
}));

app.use(express.json({limit: "50mb"}));

// Swagger API docs
setupSwagger(app, port);

// Routes
app.use("/api", ocrRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

// Start server after initializing OCR workers
async function startServer() {
  await initWorkers();

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

startServer();