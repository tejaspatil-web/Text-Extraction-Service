FROM node:20-slim

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Important for tesseract.js caching
ENV TESSDATA_PREFIX=/app/tessdata

EXPOSE 3000

CMD ["node", "src/server.js"]