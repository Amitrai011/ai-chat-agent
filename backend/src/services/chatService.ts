import type { ChatRepository } from "../repositories/chatRepository";
import type { LlmService } from "./llmService";
import { AppError } from "../errors/appError";

export class ChatService {
  constructor(
    private readonly repository: ChatRepository,
    private readonly llm: LlmService,
    private readonly historyLimit: number,
  ) {}

  async sendMessage(message: string, requestedSessionId?: string) {
    let sessionId = requestedSessionId;
    if (sessionId) {
      const isConversationExists =
        await this.repository.conversationExists(sessionId);

      if (!isConversationExists) {
        throw new AppError(
          404,
          "SESSION_NOT_FOUND",
          "This conversation no longer exists. Start a new chat.",
        );
      }
    } else {
      sessionId = await this.repository.createConversation();
    }

    await this.repository.addMessage(sessionId, "user", message);
    const history = await this.repository.getRecentMessages(
      sessionId,
      this.historyLimit,
    );

    const reply = await this.llm.generateReply(history);
    await this.repository.addMessage(sessionId, "ai", reply);

    return { reply, sessionId };
  }

  async getHistory(sessionId: string) {
    const isConversationExists =
      await this.repository.conversationExists(sessionId);

    if (!isConversationExists) {
      throw new AppError(
        404,
        "SESSION_NOT_FOUND",
        "This conversation no longer exists. Start a new chat.",
      );
    }

    return {
      sessionId,
      messages: await this.repository.getMessages(sessionId),
    };
  }
}
