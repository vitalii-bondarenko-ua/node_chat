import { roomsService } from './../services/rooms.service.js';

const getAll = (req, res) => {
  return res.json(roomsService.getAll());
};

const getById = (req, res) => {
  const { id } = req.params;
  const room = roomsService.getById(id); // шукаєш кімнату за id

  if (!room) {
    return res.status(404).send({ message: 'Not found' });
  }

  return res.json(room);
};

const createRoom = async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).send({ message: 'Name is required' });
  }

  const roomCreate = await roomsService.createRoom({
    name,
  });

  if (!roomCreate) {
    return res.status(404).send({ message: 'Create room' });
  }

  return res.status(201).json(roomCreate);
};

const upDateRoom = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) {
    return res.status(400).send({ message: 'Provide name' });
  }

  const updatedRoom = await roomsService.update({
    id,
    name,
  });

  return res.status(200).json(updatedRoom);
};

const deletedRoomById = async (req, res) => {
  const { id } = req.params;

  const deletedRoom = await roomsService.deleteById(id); // Знайти кімнату за ID

  if (!deletedRoom) {
    return res.status(404).json({ message: 'Room not found' });
  }

  return res.status(200).json(deletedRoom);
};

export const roomsController = {
  getAll,
  getById,
  createRoom,
  deletedRoomById,
  upDateRoom,
};
