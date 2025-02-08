import jwt from 'jsonwebtoken';

export function verifyToken(req) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new Error('No token provided');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.userId;
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return null;
  }
} 