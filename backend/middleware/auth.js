import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.split(' ')[1] : null;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId || decoded.id).populate('roles primaryRole');
    
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    
    // Check if user is suspended or locked
    if (user.isSuspended) {
      return res.status(403).json({ 
        message: 'Account suspended', 
        code: 'ACCOUNT_SUSPENDED' 
      });
    }
    
    if (user.isLocked) {
      return res.status(423).json({ 
        message: 'Account locked due to too many failed login attempts', 
        code: 'ACCOUNT_LOCKED' 
      });
    }
    
    if (!user.isActive) {
      return res.status(403).json({ 
        message: 'Account is not active', 
        code: 'ACCOUNT_INACTIVE' 
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const decodeSocketToken = async (token) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.userId || decoded.id).populate('roles primaryRole');
  
  if (!user) throw new Error('Unauthorized');
  
  // Check if user is suspended or locked
  if (user.isSuspended) {
    throw new Error('Account suspended');
  }
  
  if (user.isLocked) {
    throw new Error('Account locked');
  }
  
  if (!user.isActive) {
    throw new Error('Account is not active');
  }
  
  return user;
};

auth.decodeSocketToken = decodeSocketToken;

export default auth;
