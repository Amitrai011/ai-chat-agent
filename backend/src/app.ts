import cors from "cors";
import express from "express";
import type { ChatRepository } from "./repositories/chatRepository";
import type { ChatService } from "./services/chatService";
import { createChatRouter } from "./routes/chatRoutes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

type AppDependencies = {
  chatService: ChatService;
  repository: ChatRepository;
  clientOrigins: string[];
};

export function createApp({
  chatService,
  repository,
  clientOrigins,
}: AppDependencies) {
  const app = express();

  app.disable("x-powered-by");
  app.use(cors({ origin: clientOrigins, methods: ["GET", "POST"] }));
  app.use(express.json({ limit: "16kb" }));

  app.get("/api/health", async (_request, response) => {
    try {
      await repository.healthCheck();
      response.json({ status: "ok", database: "connected" });
    } catch {
      response
        .status(503)
        .json({ status: "degraded", database: "unavailable" });
    }
  });

  app.use("/api/chat", createChatRouter(chatService));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
