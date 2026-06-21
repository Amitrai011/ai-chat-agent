import { formatTime } from "../utils";

function Message({ message }) {
  const isAgent = message.sender === "ai";

  return (
    <article
      className={`message-row ${isAgent ? "agent" : "user"}`}
      aria-label={`${isAgent ? "Support agent" : "You"} said`}
    >
      {isAgent && (
        <div className="message-avatar" aria-hidden="true">
          A
        </div>
      )}
      <div>
        <div className="message-meta">{isAgent ? "Acme support" : "You"}</div>
        <div className="message-bubble">{message.text}</div>
        <time dateTime={message.createdAt}>
          {formatTime(message.createdAt)}
        </time>
      </div>
    </article>
  );
}

export default Message;
