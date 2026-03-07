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

function runOCR(buffer) {
    return new Promise((resolve, reject) => {
        console.log("Creating worker");
        const worker = new Worker(path.join(__dirname, "ocrWorker.js"));

        worker.postMessage({ buffer });

        worker.on("message", (result) => {
            console.log("Worker returned result");
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
                reject(new Error(`Worker stopped with exit code ${code}`));
            }
        });

    });
}

app.post("/extract-text", upload.single("image"), async (req, res) => {
    console.log("Request received");

    if (!req.file) {
        return res.status(400).json({
            error: "No image uploaded"
        });
    }

    try {
        console.log("Starting OCR worker");
        const text = await runOCR(req.file.buffer);

        res.json({
            success: true,
            text: text.trim()
        });

    } catch (error) {
        console.log("OCR error:", error);
        res.status(500).json({
            error: "OCR failed",
            details: error
        });

    }

});

app.listen(port, () => {
    console.log(`OCR Server running on port ${port}`);
});