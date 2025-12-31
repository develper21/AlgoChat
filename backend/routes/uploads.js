import { Router } from 'express';
import upload from '../middleware/upload.js';

const router = Router();

router.post('/file', upload.single('file'), (req, res) => {
  if (!req.file?.path) {
    return res.status(400).json({ message: 'Upload failed' });
  }

  res.json({ url: req.file.path, type: req.file.mimetype });
});

export default router;
