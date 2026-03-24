import express from "express";
import multer from "multer";
import { extractText } from "../controllers/ocr.controller.js";
import { verifyJwt,verifyServiceKey } from "../middlewares/auth.middleware.js";

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.post("/text-extraction/extract", verifyServiceKey, verifyJwt, upload.array("images"), extractText);

export default router;