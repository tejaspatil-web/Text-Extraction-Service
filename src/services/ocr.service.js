import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import { createWorker, createScheduler } from "tesseract.js";

let scheduler = null;
let isInitialized = false;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tessdataPath = path.resolve(__dirname, "../../tessdata");
const trainedDataPath = path.join(tessdataPath, "eng.traineddata");

// Limit workers
const WORKER_COUNT = 1;
const BATCH_SIZE = 1;

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
      tessedit_pageseg_mode: 6
    });

    scheduler.addWorker(worker);
  }

  isInitialized = true;
  console.log(`OCR Ready with ${WORKER_COUNT} workers`);
}

//Preprocess image
async function preprocessImage(buffer) {
  if (buffer.length < 500000) return buffer;

  // */ For now, skip preprocessing to save time. Can be enabled later if needed. */
  // return sharp(buffer)
  //   .resize({ width: 600, withoutEnlargement: true })
  //   .grayscale()
  //   .normalize()
  //   .toBuffer();

  return await sharp(buffer)
  .resize({ width: 400 })
  .grayscale()
  .toBuffer();
}

//Main function
export async function* extractTextFromPages(files = []) {
  if (!isInitialized) {
    throw new Error("OCR workers not initialized");
  }

  if (!Array.isArray(files) || files.length === 0) {
    throw new Error("No images provided");
  }

  const allResults = [];

  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.all(
      batch.map(async (file, index) => {
        const pageNumber = i + index + 1;

        try {
          const buffer = file.buffer;

          // Skip invalid/small files
          if (!buffer || buffer.length < 1000) {
            return { page: pageNumber, text: "" };
          }

          if (buffer.length > 3 * 1024 * 1024) {
            throw new Error(`File too large (max 3MB), page ${pageNumber}`);
          }

          // Preprocess (resize, grayscale, normalize)
          const processedBuffer = await preprocessImage(buffer);

          // OCR job
          const result = await scheduler.addJob(
            "recognize",
            processedBuffer,
            {
              user_defined_dpi: "150"
            }
          );

          return {
            page: pageNumber,
            text: result.data.text?.trim() || ""
          };

        } catch (err) {
          console.error(`Error processing page ${pageNumber}:`, err);

          return {
            page: pageNumber,
            text: "",
            error: true
          };
        }
      })
    );

    allResults.push(...batchResults);

    //Yield batch progress
    yield {
      type: "batch",
      processed: allResults.length,
      total: files.length,
      data: batchResults
    };
  }

  //Final result
  yield {
    type: "final",
    pages: allResults,
    fullText: allResults.map(p => p.text).join("\n\n")
  };
}