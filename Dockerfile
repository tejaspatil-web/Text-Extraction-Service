FROM node:18

# Install Tesseract OCR
RUN apt-get update && apt-get install -y tesseract-ocr

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]