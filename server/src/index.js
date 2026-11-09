'use strict';
import express from 'express';
import path from 'path';
import cors from 'cors';
import 'dotenv/config';

import { WebSocketServer } from 'ws';
// import { v4 as uuid } from 'uuid';
// import { usersRouter } from './routers/usersRouter.js';
import { roomsRouter } from './routers/roomsRouter.js';

const PORT = process.env.PORT || 3005;
const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(process.cwd())));

// app.use('/user', usersRouter);
app.use('/room', roomsRouter);
// app.use('/');

const server = app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});

const wss = new WebSocketServer({ server });
const rooms = [
  {
    id: 'room-1',
    name: 'general-chat',
    messages: [],
  },
];
wss.on('connection', (ws) => {
  ws.on('message', (text) => {
    const data = JSON.parse(text);

    switch (data.type) {
      case 'setUsername':
        ws.username = data.username; // зберігаєш ім'я для цього з'єднання
        break;

      case 'createRoom':
        const roomId = uuid(); //створити унікальний ID
        rooms[roomId] = { name: data.name, messages: [] }; // створюєш кімнату в rooms
        ws.roomId = roomId;
        ws.send(JSON.stringify({ type: 'rooCreated', roomId })); // треба відправити roomId назад клієнту
        break;

      case 'sendMessage': // відправляєш тільки в цю кімнату
        const roomFind = rooms.find((item) => item.id === data.roomId);
        if (!roomFind) {
          ws.send(
            JSON.stringify({
              type: 'error',
              message: 'Room not found',
            }),
          );
          break;
        }
        const newMessage = {
          // додаєш повідомлення в масив кімнати
          id: uuid(),
          author: data.author || ws.username || 'Anonymous',
          text: data.text,
          time: new Date().toISOString(),
        };
        roomFind.messages.push(newMessage);
        for (const client of wss.clients) {
          if (client.roomId === data.roomId) {
            client.send(
              JSON.stringify({ type: 'newMessage', message: newMessage }),
            );
          }
        }
        break;

      case 'joinRoom':
        ws.roomId = data.roomId;
        ws.send(
          JSON.stringify({
            type: 'oldMessages',
            messages: rooms[data.roomId].messages,
          }),
        );
        break;

      case 'renameRoom':
        const roomRename = rooms[data.roomId]; //знаходиш кімнату по roomId взяти roomId з data
        if (!roomRename) break; //знайти кімнату в rooms
        room.name = data.name;
        break;

      case 'deleteRoom':
        const room = rooms[data.roomId]; //знаходиш кімнату по roomId
        delete rooms[data.roomId];
        break;
    }
  });
});
