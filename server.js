const express = require('express');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();

app.use(cors())

app.use(cors({
    origin: ['https://chatfusionx.web.app','http://localhost:4200'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

const port = 3000;

const upload = multer({ dest: 'uploads/' });

app.post('/extract-text', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image uploaded' });
    }

    try {
        const imagePath = path.resolve(req.file.path);

        const result = await Tesseract.recognize(
            imagePath,
            'eng',
            { logger: m => console.log(m) }
        );

        fs.unlinkSync(imagePath);

        res.json({ text: result.data.text });
    } catch (error) {
        res.status(500).json({ error: 'Failed to extract text', details: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
});
