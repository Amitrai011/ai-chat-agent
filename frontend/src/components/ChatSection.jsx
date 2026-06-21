import { useEffect, useRef, useState } from "react";
import { SESSION_KEY, SUGGESTIONS } from "../constants";
import { ApiError, getHistory, sendChatMessage } from "../lib/api";
import Message from "./Message";

const ChatSection = () => {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [sessionId, setSessionId] = useState(() =>
    localStorage.getItem(SESSION_KEY),
  );
  const [isLoadingHistory, setIsLoadingHistory] = useState(Boolean(sessionId));
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  const endRef = useRef(null);
  const textareaRef = useRef(null);
  const skipNextHistoryLoad = useRef(false);

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  };

  const chooseSuggestion = (text) => {
    setDraft(text);
    setError("");
    textareaRef.current?.focus();
  };

  const onSubmit = async (event) => {
    event?.preventDefault();
    const text = draft.trim();

    if (!text || isSending) return;
    if (text.length > 2000) {
      setError("Please shorten your message to 2,000 characters.");
      return;
    }

    const optimistic = {
      id: `pending-${Date.now()}`,
      sender: "user",
      text,
      createdAt: new Date().toISOString(),
    };

    setMessages((current) => [...current, optimistic]);
    setError("");
    setIsSending(true);

    try {
      const data = await sendChatMessage(text, sessionId);
      if (!sessionId) {
        localStorage.setItem(SESSION_KEY, data.sessionId);
        skipNextHistoryLoad.current = true;
        setSessionId(data.sessionId);
      }

      setMessages((current) => [
        ...current,
        {
          id: `reply-${Date.now()}`,
          sender: "ai",
          text: data.reply,
          createdAt: new Date().toISOString(),
        },
      ]);

      setDraft("");
    } catch (requestError) {
      setMessages((current) =>
        current.filter((message) => message.id !== optimistic.id),
      );
      setError(
        requestError.message || "We could not reach support. Please try again.",
      );

      textareaRef.current?.focus();
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({
      behavior: messages.length > 1 ? "smooth" : "auto",
    });
  }, [messages, isSending]);

  useEffect(() => {
    if (!sessionId) return;

    if (skipNextHistoryLoad.current) {
      skipNextHistoryLoad.current = false;
      return;
    }

    const fetchHistory = async (controller) => {
      try {
        const data = await getHistory(sessionId, controller.signal);
        setMessages(data.messages);
      } catch (error) {
        if (error.name === "AbortError") return;
        if (error instanceof ApiError && error.status === 404) {
          localStorage.removeItem(SESSION_KEY);
          setSessionId(null);

          return;
        }

        setError(error.message);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    const controller = new AbortController();
    fetchHistory(controller);

    return () => {
      controller.abort();
    };
  }, [sessionId]);

  return (
    <section className="chat-card" aria-label="Customer support chat">
      <header className="chat-header">
        <div className="agent-portrait" aria-hidden="true">
          A<span className="online-dot" />
        </div>
        <div>
          <h2>Acme support</h2>
          <p>
            <span className="status-dot" />
            Online · Replies in seconds
          </p>
        </div>
        <button className="more-button" type="button" aria-label="More options">
          •••
        </button>
      </header>

      <div
        className="message-list"
        aria-live="polite"
        aria-busy={isLoadingHistory || isSending}
      >
        {isLoadingHistory ? (
          <div className="loading-history">
            Bringing back your conversation…
          </div>
        ) : (
          <>
            <div className="day-divider">
              <span>Today</span>
            </div>
            {messages.length === 0 ? (
              <Message
                message={{
                  id: "welcome",
                  sender: "ai",
                  text: "Hi there! I'm Acme's support assistant. How can I help today?",
                  createdAt: new Date().toISOString(),
                }}
              />
            ) : null}
            {messages.map((message) => (
              <Message key={message.id} message={message} />
            ))}
            {isSending ? (
              <div className="typing-row" aria-label="Agent is typing">
                <div className="message-avatar" aria-hidden="true">
                  A
                </div>
                <div className="typing-bubble">
                  <i />
                  <i />
                  <i />
                </div>
                <span>Agent is typing</span>
              </div>
            ) : null}
            <div ref={endRef} />
          </>
        )}
      </div>

      <div className="composer-area">
        {messages.length === 0 && !isLoadingHistory ? (
          <div className="suggestions" aria-label="Suggested questions">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion.label}
                type="button"
                onClick={() => chooseSuggestion(suggestion.text)}
              >
                {suggestion.label}
                <span aria-hidden="true">→</span>
              </button>
            ))}
          </div>
        ) : null}
        {error ? (
          <div className="error-banner" role="alert">
            <span>!</span>
            {error}
          </div>
        ) : null}
        <form className="composer" onSubmit={onSubmit}>
          <label className="sr-only" htmlFor="chat-message">
            Message Acme support
          </label>
          <textarea
            ref={textareaRef}
            id="chat-message"
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              setError("");
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type your message…"
            rows="1"
            maxLength="2001"
            disabled={isSending || isLoadingHistory}
          />
          <button
            type="submit"
            className="send-button"
            disabled={!draft.trim() || isSending || isLoadingHistory}
            aria-label="Send message"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m4 12 15-8-4.5 16-3.1-6.4L4 12Zm7.4 1.6L19 4" />
            </svg>
          </button>
        </form>
        <div className="composer-hint">
          <span>Enter to send · Shift + Enter for a new line</span>
          <span className={draft.length > 1800 ? "near-limit" : ""}>
            {draft.length}/2000
          </span>
        </div>
      </div>
    </section>
  );
};

export default ChatSection;
