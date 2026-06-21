import OpenAI from "openai";
import type { Message } from "../db/schema";
import { AppError } from "../errors/appError";
import { SYSTEM_PROMPT } from "../knowledge/storeKnowledge";
import { buildPromptHistory } from "./prompt";

export interface LlmService {
  generateReply(history: Pick<Message, "sender" | "text">[]): Promise<string>;
}

type LlmOptions = {
  apiKey: string;
  model: string;
  timeoutMs: number;
  historyLimit: number;
  maxOutputTokens: number;
};

export class OpenAiLlmService implements LlmService {
  private readonly client: OpenAI;

  constructor(private readonly options: LlmOptions) {
    this.client = new OpenAI({ apiKey: options.apiKey, maxRetries: 1 });
  }

  async generateReply(
    history: Pick<Message, "sender" | "text">[],
  ): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.options.timeoutMs);

    try {
      const response = await this.client.responses.create(
        {
          model: this.options.model,
          instructions: SYSTEM_PROMPT,
          input: buildPromptHistory(history, this.options.historyLimit),
          max_output_tokens: this.options.maxOutputTokens,
        },
        { signal: controller.signal },
      );

      const reply = response.output_text.trim();
      if (!reply) throw new Error("OpenAI returned an empty response");

      return reply;
    } catch (error) {
      throw mapLlmError(error, controller.signal.aborted);
    } finally {
      clearTimeout(timer);
    }
  }
}

export function mapLlmError(error: unknown, timedOut = false): AppError {
  if (error instanceof AppError) return error;

  const status =
    typeof error === "object" && error !== null && "status" in error
      ? error.status
      : undefined;

  if (error instanceof OpenAI.AuthenticationError || status === 401) {
    return new AppError(
      503,
      "AI_UNAVAILABLE",
      "The support agent is not configured correctly. Please try again later.",
    );
  }

  if (error instanceof OpenAI.RateLimitError || status === 429) {
    return new AppError(
      429,
      "AI_RATE_LIMITED",
      "The support agent is busy right now. Please retry in a moment.",
    );
  }

  if (timedOut) {
    return new AppError(
      504,
      "AI_TIMEOUT",
      "The support agent took too long to respond. Please try again.",
    );
  }

  return new AppError(
    503,
    "AI_UNAVAILABLE",
    "The support agent is temporarily unavailable. Please try again.",
  );
}
