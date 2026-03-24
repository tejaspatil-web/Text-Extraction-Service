import { extractTextFromPages } from "../services/ocr.service.js";

export async function extractText(req, res) {
  try {
    const { images } = req.body;

    const generator = extractTextFromPages(images);

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