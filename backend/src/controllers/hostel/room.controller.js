const { RoomType, HostelRoom, Hostel } = require('~/models');
const { logger } = require('~/utils/shared/logger');
const { schoolWhere, resolveSchoolBranchScope } = require('~/utils/shared/requestScope');

// Room Types
const listRoomTypes = async (req, res) => {
  try {
    const scope = await resolveSchoolBranchScope(req, { allowSchoolWide: true });
    const where = { school_id: scope.school_id };
    if (scope.branch_id) where.branch_id = scope.branch_id;
    
    const roomTypes = await RoomType.findAll({ where, order: [['created_at', 'DESC']] });
    return res.json({ success: true, data: { roomTypes } });
  } catch (error) {
    logger.error('room type list', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createRoomType = async (req, res) => {
  try {
    if (!req.body.type_name) return res.status(400).json({ success: false, message: 'type_name is required' });
    const scope = await resolveSchoolBranchScope(req, { branchRequired: true });
    
    const roomType = await RoomType.create({
      ...req.body,
      school_id: scope.school_id,
      branch_id: scope.branch_id
    });
    return res.status(201).json({ success: true, data: { roomType } });
  } catch (error) {
    logger.error('room type create', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateRoomType = async (req, res) => {
  try {
    const roomType = await RoomType.findOne({ where: { id: req.params.id, ...schoolWhere(req) } });
    if (!roomType) return res.status(404).json({ success: false, message: 'Not found' });
    
    const changes = { ...req.body };
    delete changes.school_id; delete changes.branch_id;
    await roomType.update(changes);
    return res.json({ success: true, data: { roomType } });
  } catch (error) {
    logger.error('room type update', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const removeRoomType = async (req, res) => {
  try {
    const roomType = await RoomType.findOne({ where: { id: req.params.id, ...schoolWhere(req) } });
    if (!roomType) return res.status(404).json({ success: false, message: 'Not found' });
    await roomType.destroy();
    return res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    logger.error('room type delete', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Rooms
const listRooms = async (req, res) => {
  try {
    const scope = await resolveSchoolBranchScope(req, { allowSchoolWide: true });
    const where = { school_id: scope.school_id };
    if (scope.branch_id) where.branch_id = scope.branch_id;
    if (req.query.hostel_id) where.hostel_id = req.query.hostel_id;
    
    const rooms = await HostelRoom.findAll({ 
      where, 
      include: [
        { model: RoomType, as: 'roomType' },
        { model: Hostel, as: 'hostel' }
      ],
      order: [['created_at', 'DESC']] 
    });
    return res.json({ success: true, data: { rooms } });
  } catch (error) {
    logger.error('room list', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createRoom = async (req, res) => {
  try {
    if (!req.body.room_number || !req.body.hostel_id || !req.body.room_type_id) {
      return res.status(400).json({ success: false, message: 'room_number, hostel_id, room_type_id are required' });
    }
    const scope = await resolveSchoolBranchScope(req, { branchRequired: true });
    
    const room = await HostelRoom.create({
      ...req.body,
      school_id: scope.school_id,
      branch_id: scope.branch_id
    });
    return res.status(201).json({ success: true, data: { room } });
  } catch (error) {
    logger.error('room create', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateRoom = async (req, res) => {
  try {
    const room = await HostelRoom.findOne({ where: { id: req.params.id, ...schoolWhere(req) } });
    if (!room) return res.status(404).json({ success: false, message: 'Not found' });
    
    const changes = { ...req.body };
    delete changes.school_id; delete changes.branch_id;
    await room.update(changes);
    return res.json({ success: true, data: { room } });
  } catch (error) {
    logger.error('room update', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const removeRoom = async (req, res) => {
  try {
    const room = await HostelRoom.findOne({ where: { id: req.params.id, ...schoolWhere(req) } });
    if (!room) return res.status(404).json({ success: false, message: 'Not found' });
    await room.destroy();
    return res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    logger.error('room delete', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  listRoomTypes, createRoomType, updateRoomType, removeRoomType,
  listRooms, createRoom, updateRoom, removeRoom
};
