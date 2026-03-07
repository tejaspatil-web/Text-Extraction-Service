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

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.memoryStorage()
});

function runOCR(buffer) {
  return new Promise((resolve, reject) => {

    const worker = new Worker(path.join(__dirname, "ocrWorker.js"));

    worker.postMessage({ buffer });

    worker.on("message", (result) => {
      worker.terminate();

      if (result.success) resolve(result.text);
      else reject(result.error);
    });

    worker.on("error", reject);

  });
}

app.post("/extract-text", upload.single("image"), async (req, res) => {

  if (!req.file) {
    return res.status(400).json({
      error: "No image uploaded"
    });
  }

  try {

    const text = await runOCR(req.file.buffer);

    res.json({
      success: true,
      text: text.trim()
    });

  } catch (error) {

    res.status(500).json({
      error: "OCR failed",
      details: error
    });

  }

});

app.listen(port, () => {
  console.log(`OCR Server running on port ${port}`);
});