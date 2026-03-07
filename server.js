const express = require("express");
const multer = require("multer");
const cors = require("cors");
const sharp = require("sharp");
const { createWorker } = require("tesseract.js");

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

let worker;
let isWorkerReady = false;

async function initWorker() {
  console.log("Starting OCR worker...");
  worker = await createWorker("eng");
  isWorkerReady = true;
  console.log("OCR worker ready");
}

initWorker();

let isProcessing = false;
const queue = [];

async function processQueue() {
  if (isProcessing || queue.length === 0) return;

  if (!isWorkerReady) {
    setTimeout(processQueue, 1000);
    return;
  }

  isProcessing = true;
  const job = queue.shift();

  try {
    console.log("Processing OCR job");
    // Preprocess image with sharp
    const processedBuffer = await sharp(job.buffer)
      .resize({ width: 600 })
      .grayscale()
      .normalise()
      .png()
      .toBuffer();

    const result = await worker.recognize(processedBuffer);

    job.res.json({
      success: true,
      text: result.data.text.trim()
    });
  } catch (error) {
    console.log("OCR error:", error);
    job.res.status(500).json({
      error: "OCR failed",
      details: error.message
    });
  }
  isProcessing = false;
  processQueue();
}


app.post("/extract-text", upload.single("image"), (req, res) => {
  console.log("Request received");
  if (!req.file) {
    return res.status(400).json({
      error: "No image uploaded"
    });
  }

  queue.push({
    buffer: req.file.buffer,
    res
  });
  console.log(`Queue length: ${queue.length}`);
  processQueue();
});

app.listen(port, () => {
  console.log(`OCR Server running on port ${port}`);
});