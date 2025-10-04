import express, { Express, Router } from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import cookieParser from "cookie-parser";
// Routes

import { eventRouter } from "@routes/event";
import { PrismaClient } from "@prisma/client";
import { authRouter } from "@routes/auth";
import { loadBootData } from "../prisma/seed";
import { mediaRouter } from "@routes/media";
import { initSocket } from "socket/socket";
// Load envirnoment variables
dotenv.config();

const port = process.env.PORT || 3000;

const app: Express = express();

const prisma = new PrismaClient();

const mainExec = async () => {
  if (process.env.LOAD_BOOT_DATA) {
    console.log("Loading boot data...");
    await loadBootData();
  }

  // Enables CORS middleware
  app.use(
    cors({
      origin: "*",
    })
  );
  // Looks at content type json and parses the request
  app.use(express.json());
  // Creates a simple logger
  app.use(morgan("dev"));
  // Adds a layer of secure http headers
  app.use(helmet());
  // Cookient parser middlware
  app.use(cookieParser());

  // add routes to app
  app.use("/auth", authRouter(prisma));
  app.use("/media", mediaRouter(prisma));
  app.use("/events", eventRouter(prisma));

  // Change simple express server.listen to express server + socket server
  const server = initSocket(app);
  server.listen(port, () => {
    console.log(`Starting express + socket server on port ${port}`);
  });
};

mainExec().catch((err) => {
  console.error(err);
});
