const Room = require('../models/Room');

const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find({});
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addRoom = async (req, res) => {
  const { roomNumber, capacity, floor, building } = req.body;
  try {
    const roomExists = await Room.findOne({ roomNumber });
    if (roomExists) return res.status(400).json({ message: 'Room already exists' });

    const room = await Room.create({ roomNumber, capacity, floor, building });
    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (room) {
      room.roomNumber = req.body.roomNumber || room.roomNumber;
      room.capacity = req.body.capacity || room.capacity;
      room.floor = req.body.floor || room.floor;
      room.building = req.body.building || room.building;
      room.isAvailable = req.body.isAvailable !== undefined ? req.body.isAvailable : room.isAvailable;
      
      const updatedRoom = await room.save();
      res.json(updatedRoom);
    } else {
      res.status(404).json({ message: 'Room not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (room) {
      await room.deleteOne();
      res.json({ message: 'Room removed' });
    } else {
      res.status(404).json({ message: 'Room not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getRooms, addRoom, updateRoom, deleteRoom };