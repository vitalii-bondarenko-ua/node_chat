import { useCallback } from 'react';
import { useRef } from 'react';
import { useEffect, useState } from 'react';

export const App = () => {
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [inputMessage, setInputMessage] = useState('');
  const [roomName, setRoomName] = useState('');
  const [messages, setMessages] = useState([]);
  const [editingRoomId, setEditingRoomId] = useState('');
  const [editedRoomName, setEditedRoomName] = useState('');
  const [userName] = useState(() => {
    return localStorage.getItem('userName');
  });

  const ws = useRef(null);

  useEffect(() => {
    if (userName) {
      localStorage.setItem('userName', userName);
    }
  }, [userName]);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:3005');
    ws.current = socket;
    socket.addEventListener('open', () => {
      socket.send(
        JSON.stringify({
          type: 'setUserName',
          username: userName || 'Hanna',
        }),
      );
    });

    socket.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'oldMessages') {
        setMessages(data.messages || []);
      }
      if (data.type === 'newMessage') {
        setMessages((currentMessages) => [...currentMessages, data.message]);
      }
    });

    return () => {
      socket.close();
      ws.current = null;
    };
  }, [userName]);

  const createRoom = async (roomName) => {
    if (!roomName.trim()) return;
    const response = await fetch('http://localhost:3005/room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: roomName.trim() }),
    });

    if (!response.ok) {
      throw new Error('Failed to create room');
    }
    const newRoom = await response.json();
    setRooms((currentRooms) => [...currentRooms, newRoom]);
    setRoomName('');
  };

  const fetchRooms = useCallback(async () => {
    const response = await fetch('http://localhost:3005/room');

    if (!response.ok) {
      throw new Error('Failed to fetch rooms');
    }

    return response.json();
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetchRooms()
      .then((data) => {
        if (!cancelled) {
          setRooms(data);
        }
      })
      .catch(console.error);

    return () => {
      cancelled = true;
    };
  }, [fetchRooms]);

  const handleJoinRoom = (roomId) => {
    const selectedRoom = rooms.find((room) => room.id === roomId);
    if (!selectedRoom) {
      return;
    }
    setActiveRoom(selectedRoom);
    setMessages([]);
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          type: 'joinRoom',
          roomId,
        }),
      );
    }
  };

  const handleDeleteRoom = async (id) => {
    await fetch(`http://localhost:3005/room/${id}`, {
      method: 'DELETE',
    })
      .then((data) => data.json())
      .then((deletedRoom) => {
        return setRooms((prevRooms) =>
          prevRooms.filter((room) => room.id !== deletedRoom.id),
        );
      })
      .catch((error) => console.error('Error:', error));
  };

  const handleUpdateRoom = async (roomId, newName) => {
    console.log('handleUpdateRoom', newName);
    await fetch(`http://localhost:3005/room/${roomId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName }),
    })
      .catch((error) => console.error('Error:', error))
      .finally(() => {
        setEditedRoomName('');
        setEditingRoomId('');
        fetchRooms();
      });
  };

  const handleSendMessage = (event) => {
    event.preventDefault();
    const text = inputMessage.trim();
    if (!text || !activeRoom) {
      return;
    }
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          type: 'sendMessage',
          roomId: activeRoom.id,
          author: userName,
          text: text,
        }),
      );
      setInputMessage('');
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebarHeader">
        <section>
          <h2>Rooms</h2>
          <ul className="roomList">
            {rooms.map((room) => (
              <li key={room.id} style={{ cursor: 'pointer', padding: '3px' }}>
                {editingRoomId === room.id ? (
                  <input
                    type="text"
                    value={editedRoomName}
                    onChange={(e) => setEditedRoomName(e.target.value)}
                    onBlur={() => {
                      if (!editedRoomName.trim()) {
                        setEditingRoomId('');
                        setEditedRoomName('');
                        return;
                      }
                      handleUpdateRoom(room.id, editedRoomName);
                    }}
                  />
                ) : (
                  <button type="button" onClick={() => handleJoinRoom(room.id)}>
                    {room.name}
                  </button>
                )}

                <button type="button" onClick={() => handleDeleteRoom(room.id)}>
                  x
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingRoomId(room.id);
                    setEditedRoomName(room.name);
                  }}
                >
                  ✏️
                </button>
              </li>
            ))}
          </ul>
        </section>

        <div className="createRoomActions">
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Room name"
          />
          <button
            type="button"
            className="btnCreateRoom"
            onClick={() => createRoom(roomName)}
          >
            <span>+</span>
          </button>
        </div>
      </div>

      {activeRoom && (
        <div className="activeRoomContainer">
          <h2>Current room: {activeRoom.name}</h2>
          <div className="messagesList">
            {messages.length > 0 &&
              messages.map((message) => (
                <div key={message.id}>
                  <strong>{message.author}: </strong>
                  <span>{message.text}</span>
                </div>
              ))}

            {messages.length === 0 && <p>No messages yet</p>}
          </div>

          <form className="messageForm" onSubmit={handleSendMessage}>
            <input
              type="text"
              value={inputMessage}
              placeholder="Введіть повідомлення"
              onChange={(event) => setInputMessage(event.target.value)}
            />
            <button type="submit">Send</button>
          </form>
        </div>
      )}
    </aside>
  );
};
