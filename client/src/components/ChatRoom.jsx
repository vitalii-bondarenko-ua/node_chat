import { useEffect, useRef, useState } from 'react';
import { chatApi } from '../api/chat';
import { useRoomMessages } from '../hooks/useRoomMessages';

const STATUS_LABELS = {
  connecting: 'Connecting and loading history…',
  connected: 'Online',
  offline: 'Connection lost',
  error: 'Connection error',
};

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'short',
  timeStyle: 'short',
});

export const ChatRoom = ({ room, userName }) => {
  const { messages, status, error, addMessage, reconnect } = useRoomMessages(
    room.id,
  );

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const value = text.trim();

    if (!value || sending || status !== 'connected') {
      return;
    }

    setSending(true);
    setSendError('');

    try {
      const message = await chatApi.sendMessage(room.id, userName, value);

      addMessage(message);
      setText('');
    } catch (err) {
      setSendError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="chat">
      <header className="chat-header">
        <h2># {room.name}</h2>

        <span className="muted" role="status">
          {STATUS_LABELS[status]}
        </span>

        {(status === 'offline' || status === 'error') && (
          <button onClick={reconnect}>Reconnect</button>
        )}
      </header>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <div className="messages" role="log" aria-label="Messages">
        {status === 'connected' && messages.length === 0 && (
          <p className="muted">No messages yet. Start the conversation!</p>
        )}

        {messages.map((message) => (
          <article
            key={message.id}
            className={`message ${
              message.author === userName ? 'message-own' : ''
            }`}
          >
            <div className="message-meta">
              <strong>{message.author}</strong>

              <time dateTime={message.createdAt}>
                {dateFormatter.format(new Date(message.createdAt))}
              </time>
            </div>

            <p>{message.text}</p>
          </article>
        ))}

        <div ref={endRef} />
      </div>

      {sendError && (
        <p className="error" role="alert">
          {sendError}
        </p>
      )}

      <form className="message-form" onSubmit={handleSubmit}>
        <input
          aria-label="Message text"
          placeholder="Write a message…"
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={255}
          disabled={sending || status !== 'connected'}
        />

        <button disabled={sending || status !== 'connected' || !text.trim()}>
          {sending ? 'Sending…' : 'Send'}
        </button>
      </form>
    </section>
  );
};
