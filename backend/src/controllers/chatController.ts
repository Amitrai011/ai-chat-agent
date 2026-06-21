import type { RequestHandler } from "express";
import type { ChatService } from "../services/chatService";
import { sendMessageSchema, sessionIdSchema } from "../validation/chat";

export function createChatController(service: ChatService) {
  const sendMessage: RequestHandler = async (request, response, next) => {
    try {
      const input = sendMessageSchema.parse(request.body);
      response
        .status(200)
        .json(await service.sendMessage(input.message, input.sessionId));
    } catch (error) {
      next(error);
    }
  };

  const getHistory: RequestHandler = async (request, response, next) => {
    try {
      const sessionId = sessionIdSchema.parse(request.params.sessionId);
      response.json(await service.getHistory(sessionId));
    } catch (error) {
      next(error);
    }
  };

  return { sendMessage, getHistory };
}
