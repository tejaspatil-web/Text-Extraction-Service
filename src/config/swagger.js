import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

export function setupSwagger(app, port) {
  const options = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "OCR API",
        version: "1.0.0",
        description: "Image to Text Extraction API"
      },
      servers: [
        {
          url: process.env.BASE_URL || `http://localhost:${port}`
        }
      ]
    },
    apis: ["./src/docs/*.js"]
  };

  const swaggerSpec = swaggerJsdoc(options);

  if (process.env.NODE_ENV === "development") {
    app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    console.log("Swagger running at /swagger");
  }
}