/**
 * @swagger
 * tags:
 *   name: OCR
 *   description: OCR related APIs
 */

/**
 * @swagger
 * /api/text-extraction/extract:
 *   post:
 *     summary: Extract text from multiple images (batch optimized OCR)
 *     description: >
 *       Accepts an array of base64 images (converted from PDF pages) and extracts text from each page.
 *       The processing is internally optimized using batching and parallel workers for better performance.
 *     tags: [OCR]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - images
 *             properties:
 *               images:
 *                 type: array
 *                 description: Array of base64 encoded images
 *                 items:
 *                   type: string
 *                   example: "iVBORw0KGgoAAAANSUhEUgAA..."
 *     responses:
 *       200:
 *         description: Successfully extracted text from all pages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 pages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       page:
 *                         type: number
 *                         example: 1
 *                       text:
 *                         type: string
 *                         example: "Extracted text from page..."
 *                 fullText:
 *                   type: string
 *                   example: "Page 1 text...\n\nPage 2 text..."
 *       400:
 *         description: Invalid request (missing or empty images array)
 *       500:
 *         description: OCR processing failed
 */