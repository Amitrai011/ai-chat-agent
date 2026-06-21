# Acme AI Support Chat

A production-ready customer support chat application that combines a responsive React frontend, a layered TypeScript backend, PostgreSQL persistence with Drizzle ORM, and context-aware AI responses powered by OpenAI.

## What it does

- Persists conversations and restores them after a reload.
- Answers against a fixed fictional-store FAQ for reliable shipping, returns, and support-hours responses.
- Includes recent conversation context in each OpenAI request.
- Handles empty/oversized messages, invalid sessions, network failures, provider errors, and timeouts without exposing internals.
- Provides responsive desktop/mobile UI, keyboard sending, loading feedback, suggestions, and accessible live status.

## Run locally

Prerequisites: Node.js 20+, npm, PostgreSQL, and an OpenAI API key.

1. Create the database:

   ```bash
   createdb spur_chat
   ```

2. Configure and migrate the API:

   ```bash
   cd backend
   # Add your OPENAI_API_KEY and adjust DATABASE_URL if needed.
   npm install
   npm run db:migrate
   npm run dev
   ```

3. In another terminal, start the client:

   ```bash
   cd frontend
   # Add your VITE_API_URL
   npm install
   npm run dev
   ```

4. Open `http://localhost:5173`.

## Environment variables

| Variable                | Required | Default                 | Purpose                                 |
| ----------------------- | -------- | ----------------------- | --------------------------------------- |
| `DATABASE_URL`          | Yes      | —                       | PostgreSQL connection string            |
| `OPENAI_API_KEY`        | Yes      | —                       | Server-side OpenAI credential           |
| `OPENAI_MODEL`          | No       | `gpt-5.4-mini`          | Responses API model                     |
| `PORT`                  | No       | `3000`                  | API port                                |
| `CLIENT_ORIGIN`         | No       | `http://localhost:5173` | Comma-separated allowed browser origins |
| `LLM_TIMEOUT_MS`        | No       | `20000`                 | Provider request timeout                |
| `HISTORY_LIMIT`         | No       | `20`                    | Recent messages sent to OpenAI          |
| `LLM_MAX_OUTPUT_TOKENS` | No       | `300`                   | Reply cost/length ceiling               |
| `VITE_API_URL`          | No       | `http://localhost:3000` | Browser-facing API origin               |

## Database workflows

The committed SQL migration is under `backend/drizzle`.

```bash
cd backend
npm run db:generate  # generate a migration after schema edits
npm run db:migrate   # apply pending migrations
```

The schema has `conversations` and `messages`. Messages belong to a conversation, identify their `user`/`ai` sender, and cascade on conversation deletion. The `(conversation_id, created_at)` index supports history reads.

## Architecture

The API follows a deliberately small layered design:

```text
HTTP route/controller → ChatService → repository (Drizzle/PostgreSQL)
                              └──────→ LlmService (OpenAI Responses API)
```

- Controllers validate external input with Zod and translate it into service calls.
- `ChatService` owns conversation flow: verify/create a session, store the user message, build recent history, request a reply, and store the AI message.
- The repository and LLM are interfaces. Additional channels can reuse `ChatService`; another model provider can implement `LlmService` without touching routes or persistence.
- A global error boundary emits stable `{ error: { code, message } }` responses and logs unexpected errors only on the server.

### HTTP API

- `POST /api/chat/message` — `{ "message": "...", "sessionId"?: "uuid" }` → `{ "reply": "...", "sessionId": "uuid" }`
- `GET /api/chat/:sessionId/messages` — ordered persisted history
- `GET /api/health` — process and database readiness

## LLM notes

The OpenAI call uses the Responses API. A system instruction contains the Acme & Co. policies and tells the model not to invent policies, order access, discounts, or guarantees. Up to the latest 20 persisted messages are mapped to `user`/`assistant` input so follow-up questions remain contextual.

The model, output ceiling, history limit, and timeout are configurable. The default model favors latency and cost for concise FAQ support, while the service abstraction keeps provider replacement straightforward. When OpenAI fails, the user message remains persisted but no synthetic AI message is written.
