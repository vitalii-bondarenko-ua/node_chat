import { useCallback, useEffect, useState } from 'react';
import { chatApi, WS_URL } from '../api/chat';

const mergeMessages = (current, incoming) => {
  const messages = new Map(
    [...current, ...incoming].map((message) => [message.id, message]),
  );

  return [...messages.values()].sort(
    (a, b) =>
      new Date(a.createdAt) - new Date(b.createdAt) || a.id.localeCompare(b.id),
  );
};

export const useRoomMessages = (roomId) => {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('connecting');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  const addMessage = useCallback((message) => {
    setMessages((current) => mergeMessages(current, [message]));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const socket = new WebSocket(WS_URL);
    let disposed = false;
    let loadingHistory = false;

    setStatus('connecting');
    setError('');

    socket.onopen = () => {
      socket.send(JSON.stringify({ event: 'join', roomId }));
    };

    socket.onmessage = async ({ data }) => {
      try {
        const { event, payload } = JSON.parse(data);

        if (event === 'error') {
          setError(payload.message);
          setStatus('error');

          return;
        }

        if (event === 'message:created' && payload.roomId === roomId) {
          addMessage(payload);
        }

        if (
          event === 'joined' &&
          payload.roomId === roomId &&
          !loadingHistory
        ) {
          loadingHistory = true;

          const history = await chatApi.getMessages(roomId, controller.signal);

          if (!disposed) {
            setMessages((current) => mergeMessages(current, history));
            setStatus(
              socket.readyState === WebSocket.OPEN ? 'connected' : 'offline',
            );
          }
        }
      } catch (err) {
        if (!disposed && err.name !== 'AbortError') {
          setError(err.message);
          setStatus('error');
        }
      }
    };

    socket.onerror = () => {
      if (!disposed) {
        setError('Unable to connect to the chat');
      }
    };

    socket.onclose = () => {
      if (!disposed) {
        setStatus('offline');
      }
    };

    return () => {
      disposed = true;
      controller.abort();

      socket.onopen = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;

      socket.close();
    };
  }, [roomId, attempt, addMessage]);

  const reconnect = () => setAttempt((value) => value + 1);

  return { messages, status, error, addMessage, reconnect };
};
