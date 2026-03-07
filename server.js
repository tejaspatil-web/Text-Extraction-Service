const express = require("express");
const multer = require("multer");
const { Worker } = require("worker_threads");
const path = require("path");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
    origin: [
        "https://chatfusionx.web.app",
        "http://localhost:4200"
    ]
}));

const upload = multer({
    storage: multer.memoryStorage()
});

let isProcessing = false;
const queue = [];

async function processQueue() {
  if (isProcessing || queue.length === 0) return;
  isProcessing = true;
  const job = queue.shift();
  try {
    console.log("Starting OCR job");
    const text = await runOCR(job.buffer);
    job.res.json({
      success: true,
      text: text.trim()
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

function runOCR(buffer) {
  return new Promise((resolve, reject) => {
    console.log("Creating worker");
    const worker = new Worker(
      path.join(__dirname, "ocrWorker.js")
    );

    worker.postMessage({ buffer });

    worker.on("message", (result) => {
      console.log("Worker finished OCR");
      worker.terminate();
      if (result.success) resolve(result.text);
      else reject(result.error);
    });

    worker.on("error", (err) => {
      console.log("Worker error:", err);
      worker.terminate();
      reject(err);
    });

    worker.on("exit", (code) => {
      if (code !== 0) {
        console.log(`Worker exited with code ${code}`);
      }
    });
  });
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