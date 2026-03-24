import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import sharp from "sharp";
import { createWorker, createScheduler } from "tesseract.js";

let scheduler = null;
let isInitialized = false;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tessdataPath = path.resolve(__dirname, "../../tessdata");
const trainedDataPath = path.join(tessdataPath, "eng.traineddata");

// Limit workers to 2
const WORKER_COUNT = Math.min(2, os.cpus().length);
const BATCH_SIZE = 2;

//Initialize tesseract workers
export async function initWorkers() {
  if (isInitialized) return;

  if (!fs.existsSync(trainedDataPath)) {
    throw new Error("eng.traineddata not found at: " + trainedDataPath);
  }

  console.log("Using traineddata at:", trainedDataPath);

  scheduler = createScheduler();

  for (let i = 0; i < WORKER_COUNT; i++) {
    const worker = await createWorker("eng", {
      langPath: tessdataPath,
      cachePath: "/tmp",
      gzip: false
    });

    await worker.setParameters({
      tessedit_pageseg_mode: 6,
      tessedit_ocr_engine_mode: 0
    });

    scheduler.addWorker(worker);
  }

  isInitialized = true;
  console.log(`OCR Ready with ${WORKER_COUNT} workers`);
}

//Preprocess image
async function preprocessImage(buffer) {
  if (buffer.length < 500000) return buffer;

  return sharp(buffer)
    .resize({ width: 600, withoutEnlargement: true })
    .grayscale()
    .normalize()
    .toBuffer();
}

//Main function
export async function* extractTextFromPages(base64Images = []) {
  if (!isInitialized) {
    throw new Error("OCR workers not initialized");
  }

  if (!Array.isArray(base64Images) || base64Images.length === 0) {
    throw new Error("No images provided");
  }

  const allResults = [];

  for (let i = 0; i < base64Images.length; i += BATCH_SIZE) {
    const batch = base64Images.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.all(
      batch.map(async (base64, index) => {
        const pageNumber = i + index + 1;

        try {
          const buffer = Buffer.from(base64, "base64");

          if (buffer.length < 1000) {
            return { page: pageNumber, text: "" };
          }

          const processedBuffer = await preprocessImage(buffer);

          const result = await scheduler.addJob("recognize", processedBuffer, {
            user_defined_dpi: "200"
          });

          return {
            page: pageNumber,
            text: result.data.text.trim()
          };

        } catch (err) {
          console.error(`Error processing page ${pageNumber}:`, err);
          return { page: pageNumber, text: "" };
        }
      })
    );

    allResults.push(...batchResults);

    yield {
      type: "batch",
      processed: allResults.length,
      total: base64Images.length,
      data: batchResults
    };
  }

  yield {
    type: "final",
    pages: allResults,
    fullText: allResults.map(p => p.text).join("\n\n")
  };
}