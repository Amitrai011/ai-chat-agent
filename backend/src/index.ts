import { createApp } from "./app";
import { env } from "./config/env";
import { db, pool } from "./db/client";
import { DrizzleChatRepository } from "./repositories/chatRepository";
import { ChatService } from "./services/chatService";
import { OpenAiLlmService } from "./services/llmService";

const repository = new DrizzleChatRepository(db);

const llm = new OpenAiLlmService({
  apiKey: env.OPENAI_API_KEY,
  model: env.OPENAI_MODEL,
  timeoutMs: env.LLM_TIMEOUT_MS,
  historyLimit: env.HISTORY_LIMIT,
  maxOutputTokens: env.LLM_MAX_OUTPUT_TOKENS,
});

const chatService = new ChatService(repository, llm, env.HISTORY_LIMIT);
const app = createApp({
  chatService,
  repository,
  clientOrigins: env.CLIENT_ORIGIN.split(",").map((origin) => origin.trim()),
});

const server = app.listen(env.PORT, () => {
  console.log(`Spur chat API listening on port ${env.PORT}`);
});

async function shutdown(signal: string) {
  console.log(`${signal} received; shutting down`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
