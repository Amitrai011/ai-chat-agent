import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url().startsWith("postgres"),
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL: z.string().min(1).default("gpt-5.4-mini"),
  CLIENT_ORIGIN: z.string().default("http://localhost:5173"),
  LLM_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .min(1_000)
    .max(120_000)
    .default(20_000),
  HISTORY_LIMIT: z.coerce.number().int().min(1).max(50).default(20),
  LLM_MAX_OUTPUT_TOKENS: z.coerce
    .number()
    .int()
    .min(50)
    .max(2_000)
    .default(300),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const names = parsed.error.issues
    .map((issue) => issue.path.join("."))
    .join(", ");
  throw new Error(`Invalid environment configuration: ${names}`);
}

export const env = parsed.data;
