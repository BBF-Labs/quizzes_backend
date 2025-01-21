// swaggerConfig.js

import swaggerJsdoc from "swagger-jsdoc";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Bbf-quizzes-api", 
    version: "1.0.0",
    description: "Interactive API documentation", 
  },
  servers: [
    {
      url: "http://localhost:3000",
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ["./src/routes/*.ts"], 
};

export const swaggerSpec = swaggerJsdoc(options);


