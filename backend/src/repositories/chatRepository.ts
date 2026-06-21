import { asc, desc, eq, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import {
  conversations,
  messages,
  type Message,
  type MessageSender,
} from "../db/schema";

export interface ChatRepository {
  createConversation(): Promise<string>;
  conversationExists(id: string): Promise<boolean>;
  addMessage(
    conversationId: string,
    sender: MessageSender,
    text: string,
  ): Promise<Message>;
  getMessages(conversationId: string): Promise<Message[]>;
  getRecentMessages(conversationId: string, limit: number): Promise<Message[]>;
  healthCheck(): Promise<void>;
}

export class DrizzleChatRepository implements ChatRepository {
  constructor(private readonly database: NodePgDatabase) {}

  async createConversation(): Promise<string> {
    const [conversation] = await this.database
      .insert(conversations)
      .values({})
      .returning({ id: conversations.id });
    if (!conversation) throw new Error("Failed to create conversation");
    return conversation.id;
  }

  async conversationExists(id: string): Promise<boolean> {
    const [conversation] = await this.database
      .select({ id: conversations.id })
      .from(conversations)
      .where(eq(conversations.id, id))
      .limit(1);
    return Boolean(conversation);
  }

  async addMessage(
    conversationId: string,
    sender: MessageSender,
    textValue: string,
  ): Promise<Message> {
    const [message] = await this.database
      .insert(messages)
      .values({ conversationId, sender, text: textValue })
      .returning();
    if (!message) throw new Error("Failed to create message");
    return message;
  }

  getMessages(conversationId: string): Promise<Message[]> {
    return this.database
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt), asc(messages.id));
  }

  async getRecentMessages(
    conversationId: string,
    limit: number,
  ): Promise<Message[]> {
    const recent = await this.database
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt), desc(messages.id))
      .limit(limit);
    return recent.reverse();
  }

  async healthCheck(): Promise<void> {
    await this.database.execute(sql`select 1`);
  }
}
