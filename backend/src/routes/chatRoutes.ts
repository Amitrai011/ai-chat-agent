import { Router } from "express";
import type { ChatService } from "../services/chatService";
import { createChatController } from "../controllers/chatController";

export function createChatRouter(service: ChatService) {
  const router = Router();
  const controller = createChatController(service);

  router.post("/message", controller.sendMessage);
  router.get("/:sessionId/messages", controller.getHistory);

  return router;
}
