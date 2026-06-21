import { z } from "zod";

export const sessionIdSchema = z.uuid("Session ID must be a valid UUID.");

export const sendMessageSchema = z
  .object({
    message: z
      .string({ error: "Message must be text." })
      .transform((value) => value.trim())
      .pipe(
        z
          .string()
          .min(1, "Message cannot be empty.")
          .max(2_000, "Message cannot exceed 2,000 characters."),
      ),
    sessionId: sessionIdSchema.optional(),
  })
  .strict();

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
