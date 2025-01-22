import swaggerJsdoc from "swagger-jsdoc";
import { Config } from "../config";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Bbf-quizzes-api",
    version: "1.0.0",
    description: "Interactive API documentation",
  },
  servers: [
    {
      url: `http://localhost:${Config.PORT}`,
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ["./src/routes/*.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
