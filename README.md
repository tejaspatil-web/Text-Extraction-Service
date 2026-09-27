# Text Extraction Service

A lightweight Node.js OCR microservice that extracts text from images
using **Tesseract.js**.

The service is designed to process images generated from PDF pages and
return both page-level text and combined document text. It includes
image preprocessing with Sharp, JWT authentication, service-to-service
authentication, Swagger documentation, and Docker support.

## Features

-   OCR-based text extraction from images
-   Multiple image/page processing
-   Page-level extracted text
-   Combined full-text response
-   Image preprocessing using Sharp
-   Grayscale, normalization, sharpening, and thresholding
-   Tesseract.js OCR engine
-   English language trained data
-   JWT Bearer authentication
-   Service-to-service authentication using `X-SERVICE-KEY`
-   Health check endpoint
-   Swagger/OpenAPI documentation
-   Docker support
-   In-memory multipart file processing
-   Per-page file size validation
-   Temporary processing without storing uploaded images on disk

## Tech Stack

-   Node.js 20
-   Express.js
-   JavaScript
-   Tesseract.js
-   Sharp
-   Multer
-   JWT
-   Swagger / OpenAPI
-   Docker

## Architecture

``` text
PDF Pages / Images
        |
        v
+----------------------------+
|   Text Extraction API      |
|        Express.js          |
+-------------+--------------+
              |
              v
+----------------------------+
|     Image Preprocessing    |
|          Sharp             |
|                            |
| Resize / Grayscale         |
| Normalize / Sharpen        |
| Threshold                  |
+-------------+--------------+
              |
              v
+----------------------------+
|        Tesseract.js        |
|           OCR              |
+-------------+--------------+
              |
              v
+----------------------------+
| Page Text + Full Text      |
+----------------------------+
```

## Project Structure

``` text
Text-Extraction-Service/
│
├── src/
│   ├── config/
│   │   └── swagger.js
│   │
│   ├── controllers/
│   │   └── ocr.controller.js
│   │
│   ├── docs/
│   │   └── ocr.swagger.js
│   │
│   ├── middlewares/
│   │   └── auth.middleware.js
│   │
│   ├── routes/
│   │   └── ocr.routes.js
│   │
│   ├── services/
│   │   └── ocr.service.js
│   │
│   └── server.js
│
├── tessdata/
│   └── eng.traineddata
│
├── Dockerfile
├── package.json
├── package-lock.json
└── .dockerignore
```

## API

### Extract Text from Images

``` http
POST /api/text-extraction/extract
```

The endpoint accepts multiple images using `multipart/form-data`.

### Required Headers

``` http
Authorization: Bearer <JWT_TOKEN>
X-SERVICE-KEY: <SERVICE_KEY>
```

### Request

The form field name is:

``` text
images
```

Example using cURL:

``` bash
curl -X POST \
  http://localhost:3000/api/text-extraction/extract \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "X-SERVICE-KEY: <SERVICE_KEY>" \
  -F "images=@page-1.png" \
  -F "images=@page-2.png"
```

Multiple images can be uploaded in the same request.

## Response

A successful request returns:

``` json
{
  "success": true,
  "pages": [
    {
      "page": 1,
      "text": "Text extracted from page one..."
    },
    {
      "page": 2,
      "text": "Text extracted from page two..."
    }
  ],
  "fullText": "Text extracted from page one...\n\nText extracted from page two..."
}
```

### Response Fields

  Field        Description
  ------------ ---------------------------------------------------------
  `success`    Indicates whether OCR processing completed successfully
  `pages`      Contains OCR results for each uploaded image
  `page`       Page/image sequence number
  `text`       Text extracted from the individual page
  `fullText`   All page text combined in document order

## OCR Processing Flow

``` text
Images
  |
  v
Validate Files
  |
  v
Image Preprocessing
  |
  +--> Resize
  +--> Grayscale
  +--> Normalize
  +--> Sharpen
  +--> Threshold
  |
  v
Tesseract.js
  |
  v
Extract Text
  |
  v
Page-Level Results
  |
  v
Combined Full Text
```

## Image Preprocessing

For images larger than 500 KB, the service applies preprocessing using
Sharp:

``` text
Resize to maximum width of 1000px
        ↓
Grayscale
        ↓
Normalize contrast
        ↓
Sharpen
        ↓
Threshold
```

This preprocessing is intended to improve OCR quality while reducing
unnecessary image size.

Images smaller than 500 KB are passed directly to the OCR engine.

## OCR Configuration

The service uses Tesseract.js with the English trained data:

``` text
tessdata/eng.traineddata
```

OCR configuration includes:

``` text
Page Segmentation Mode: 3
OCR Engine Mode: 1
Preserve Interword Spaces: enabled
User Defined DPI: 300
```

The service initializes the OCR worker before starting the HTTP server.

## Processing Limits

Each uploaded image is validated before OCR processing.

-   Maximum image size: **3 MB per page**
-   Empty or very small files are skipped
-   Images are processed in batches
-   Current worker count: **1**
-   Current batch size: **1**

These values can be adjusted in:

``` text
src/services/ocr.service.js
```

## Authentication

### JWT Authentication

Protected requests require a valid JWT:

``` http
Authorization: Bearer <JWT_TOKEN>
```

The token is verified using the configured `JWT_SECRET`.

### Service-to-Service Authentication

The service also requires:

``` http
X-SERVICE-KEY: <SERVICE_KEY>
```

The service key is validated before JWT authentication and OCR
processing.

This provides an additional security layer for communication between
backend services or through an API Gateway.

## Health Check

The service exposes:

``` http
GET /health
```

Example response:

``` json
{
  "status": "OK"
}
```

This endpoint can be used by deployment platforms and monitoring systems
to verify service availability.

## Swagger / OpenAPI

Swagger documentation is configured in the application.

When running locally, open the Swagger UI URL configured by the
application, typically:

``` text
http://localhost:3000/api-docs
```

Swagger configuration is located in:

``` text
src/config/swagger.js
```

API documentation:

``` text
src/docs/ocr.swagger.js
```

## Configuration

The service uses environment variables for runtime configuration.

### Environment Variables

``` text
PORT
JWT_SECRET
SERVICE_KEY
CORS_ALLOWED_ORIGINS
```

Example:

``` env
PORT=3000
JWT_SECRET=your-jwt-secret
SERVICE_KEY=your-service-key
CORS_ALLOWED_ORIGINS=http://localhost:4200
```

Multiple CORS origins can be provided as a comma-separated list:

``` env
CORS_ALLOWED_ORIGINS=http://localhost:4200,https://example.com
```

Do not commit production secrets to source control.

## Running Locally

### Prerequisites

Install:

-   Node.js 20+
-   npm

### Clone Repository

``` bash
git clone https://github.com/tejaspatil-web/Text-Extraction-Service.git
cd Text-Extraction-Service
```

### Install Dependencies

``` bash
npm install
```

### Configure Environment

Create a `.env` file:

``` env
PORT=3000
JWT_SECRET=your-jwt-secret
SERVICE_KEY=your-service-key
CORS_ALLOWED_ORIGINS=http://localhost:4200
```

### Start the Service

``` bash
npm start
```

For development:

``` bash
npm run dev
```

The API will be available at:

``` text
http://localhost:3000
```

Health check:

``` text
http://localhost:3000/health
```

## Docker

The repository includes a Dockerfile based on Node.js 20 Slim.

### Build Image

``` bash
docker build -t text-extraction-service .
```

### Run Container

``` bash
docker run -p 3000:3000 \
  -e PORT=3000 \
  -e JWT_SECRET="your-jwt-secret" \
  -e SERVICE_KEY="your-service-key" \
  -e CORS_ALLOWED_ORIGINS="http://localhost:4200" \
  text-extraction-service
```

The service will be available at:

``` text
http://localhost:3000
```

## Integration with PDF Processing

This service can be used as part of a document-processing pipeline.

For example:

``` text
PDF
 |
 v
PDF-to-PNG Service
 |
 v
PNG Pages
 |
 v
Text Extraction Service
 |
 v
OCR Text
 |
 v
RAG / LLM Processing
```

This separation allows PDF conversion and OCR processing to be
independently maintained and deployed.

## Error Handling

### No Images Uploaded

``` http
400 Bad Request
```

``` json
{
  "error": "No images uploaded"
}
```

### Missing Service Key

``` http
401 Unauthorized
```

``` json
{
  "message": "Service key missing"
}
```

### Invalid Service Key

``` http
403 Forbidden
```

``` json
{
  "message": "Invalid service key"
}
```

### Missing or Invalid JWT

``` http
401 Unauthorized
```

### OCR Failure

``` http
500 Internal Server Error
```

``` json
{
  "error": "OCR failed",
  "details": "..."
}
```

## Use Cases

This service can be used for:

-   PDF text extraction
-   OCR processing
-   Document digitization
-   Resume processing
-   AI document processing
-   RAG document ingestion
-   Scanned document processing
-   Image-to-text conversion
-   Document analysis pipelines

## Design Considerations

The service uses in-memory file uploads through Multer, so uploaded
images do not need to be persisted to disk before OCR processing.

Tesseract workers are initialized during application startup. The server
starts listening only after OCR initialization completes successfully.

The OCR service is implemented as an asynchronous generator so batch
progress can be yielded internally while processing multiple pages.

## License

This project is available for personal and educational use.

If you plan to distribute or reuse this project, add an appropriate
open-source license such as MIT.
