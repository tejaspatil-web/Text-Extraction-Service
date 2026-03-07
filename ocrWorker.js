const { parentPort } = require("worker_threads");
const sharp = require("sharp");
const tesseract = require("node-tesseract-ocr");
const fs = require("fs");
const path = require("path");

const config = {
    lang: "eng",
    oem: 1,
    psm: 3
};

const uploadDir = path.join(__dirname, "uploads");

// Create uploads folder once
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

parentPort.on("message", async (data) => {
    console.log("Worker received message");
    const tempFile = path.join(uploadDir, `${Date.now()}.png`);

    try {
        console.log("Starting sharp processing");
        await sharp(data.buffer)
            .resize({ width: 1200 })
            .grayscale()
            .png()
            .toFile(tempFile);
        console.log("Sharp finished");

        console.log("Starting OCR");
        const text = await tesseract.recognize(tempFile, config);
        console.log("OCR finished");

        if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
        }

        parentPort.postMessage({
            success: true,
            text
        });
    } catch (error) {
        if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
        }

        parentPort.postMessage({
            success: false,
            error: error.message
        });
    }
});