const express = require("express");
const multer = require("multer");
const cors = require("cors");
const sharp = require("sharp");
const { createWorker, createScheduler } = require("tesseract.js");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: [
    "https://chatfusionx.web.app",
    "http://localhost:4200"
  ]
}));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

const scheduler = createScheduler();

async function initWorkers() {
  console.log("Starting OCR workers...");
  const workerCount = 2;

  for (let i = 0; i < workerCount; i++) {
    const worker = await createWorker("eng");
    scheduler.addWorker(worker);
  }
  console.log(`${workerCount} OCR workers ready`);
}

initWorkers();

app.post("/extract-text", upload.single("image"), async (req, res) => {
  console.log("OCR request received");
  if (!req.file) {
    return res.status(400).json({
      error: "No image uploaded"
    });
  }
  try {
    // preprocess image
    const processedBuffer = await sharp(req.file.buffer)
      .resize({ width: 600 })
      .grayscale()
      .normalise()
      .png()
      .toBuffer();

    const result = await scheduler.addJob("recognize", processedBuffer);

    res.json({
      success: true,
      text: result.data.text.trim()
    });
  } catch (error) {
    console.log("OCR error:", error);
    res.status(500).json({
      error: "OCR failed",
      details: error.message
    });
  }
});

app.listen(port, () => {
  console.log(`OCR Server running on port ${port}`);
});