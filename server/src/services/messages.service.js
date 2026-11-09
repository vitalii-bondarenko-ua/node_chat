import { Message } from '../models/message.js';

const listMessages = async (roomId) => {
  return Message.findAll({
    where: { roomId },
    order: [
      ['createdAt', 'ASC'],
      ['id', 'ASC'],
    ],
  });
};

const createMessage = async (roomId, author, text) => {
  return Message.create({
    roomId,
    author,
    text,
  });
};

export const messagesService = {
  listMessages,
  createMessage,
};
