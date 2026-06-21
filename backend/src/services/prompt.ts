import type { Message } from "../db/schema";

export type PromptMessage = { role: "user" | "assistant"; content: string };

export function buildPromptHistory(
  history: Pick<Message, "sender" | "text">[],
  limit = 20,
): PromptMessage[] {
  return history.slice(-limit).map((message) => ({
    role: message.sender === "ai" ? "assistant" : "user",
    content: message.text,
  }));
}
