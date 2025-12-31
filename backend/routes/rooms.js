import { Router } from 'express';
import { listRooms, createRoom, getRoomMessages } from '../controllers/roomController.js';

const router = Router();

router.get('/', listRooms);
router.post('/', createRoom);
router.get('/:roomId/messages', getRoomMessages);

export default router;
