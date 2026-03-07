const { parentPort } = require("worker_threads");
const sharp = require("sharp");
const tesseract = require("node-tesseract-ocr");
const fs = require("fs");
const path = require("path");

const config = {
  lang: "eng",
  oem: 1,
  psm: 3,
  tessdataDir: path.join(__dirname, "tessdata")
};

parentPort.on("message", async (data) => {
    const uploadDir = path.join(__dirname, "uploads");

    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

  const tempFile = path.join(__dirname,"uploads",`${Date.now()}.png`);

  try {
    await sharp(data.buffer)
      .resize({ width: 1200 })
      .grayscale()
      .png()
      .toFile(tempFile);

    const text = await tesseract.recognize(
      tempFile,
      config
    );

    fs.unlinkSync(tempFile);

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