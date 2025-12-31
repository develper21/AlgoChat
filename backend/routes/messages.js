import { Router } from 'express';
import { sendMessage, editMessage, deleteMessage } from '../controllers/messageController.js';

const router = Router();

router.post('/', sendMessage);
router.put('/:messageId/edit', editMessage);
router.delete('/:messageId', deleteMessage);

export default router;
