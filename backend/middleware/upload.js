import multer from 'multer';
import CloudinaryStorage from 'multer-storage-cloudinary';
import cloudinary from '../utils/cloudinary.js';

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'algonive_chat_uploads',
    resource_type: 'auto',
    public_id: `${req.user?._id || 'anonymous'}-${Date.now()}`
  })
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

export default upload;
