import { Router } from 'express';
import { messagesController } from '../controllers/messages.controller.js';

export const messagesRouter = Router({ mergeParams: true });

messagesRouter.get('/', messagesController.getMessages);
messagesRouter.post('/', messagesController.createMessage);
