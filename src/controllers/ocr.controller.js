import { extractTextFromPages } from "../services/ocr.service.js";

export async function extractText(req, res) {
  try {
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No images uploaded" });
    }

    // convert buffers → pass directly
    const generator = extractTextFromPages(files);

    let finalResult;

    for await (const chunk of generator) {
      if (chunk.type === "batch") {
        console.log("Batch done:", chunk.processed);
      } else if (chunk.type === "final") {
        finalResult = chunk;
      }
    }

    res.json({ success: true, ...finalResult });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "OCR failed",
      details: error.message
    });
  }
}