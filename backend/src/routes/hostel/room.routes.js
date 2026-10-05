const express = require('express');
const { verifyToken, setSchoolContext, authorize } = require('~/middleware/core/auth');
const { 
  listRoomTypes, createRoomType, updateRoomType, removeRoomType,
  listRooms, createRoom, updateRoom, removeRoom 
} = require('~/controllers/hostel/room.controller');

const router = express.Router();
router.use(verifyToken, setSchoolContext, authorize(['super_admin', 'admin', 'branch_admin']));

// Room Types
router.get('/types', listRoomTypes);
router.post('/types', createRoomType);
router.put('/types/:id', updateRoomType);
router.delete('/types/:id', removeRoomType);

// Rooms
router.get('/', listRooms);
router.post('/', createRoom);
router.put('/:id', updateRoom);
router.delete('/:id', removeRoom);

module.exports = router;
