import express from "express";
import { extractText } from "../controllers/ocr.controller.js";
import { verifyJwt,verifyServiceKey } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/text-extraction/extract", verifyServiceKey, verifyJwt, extractText);

export default router;