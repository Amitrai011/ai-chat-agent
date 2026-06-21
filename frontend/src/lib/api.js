const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function request(path, options) {
  let response;

  try {
    response = await fetch(`${API_URL}${path}`, options);
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new ApiError(
      "We could not reach support. Check your connection and try again.",
      0,
      "NETWORK_ERROR",
    );
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(
      data.error?.message || "Something went wrong. Please try again.",
      response.status,
      data.error?.code,
    );
  }

  return data;
}

export function getHistory(sessionId, signal) {
  return request(`/api/chat/${encodeURIComponent(sessionId)}/messages`, {
    signal,
  });
}

export function sendChatMessage(message, sessionId) {
  return request("/api/chat/message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, ...(sessionId ? { sessionId } : {}) }),
  });
}
