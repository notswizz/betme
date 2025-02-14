import jwt from 'jsonwebtoken';

export function verifyToken(token) {
  if (!token || typeof token !== 'string') {
    return null;
  }

  try {
    // Remove 'Bearer ' prefix if present
    const actualToken = token.startsWith('Bearer ') ? token.slice(7) : token;
    
    const decoded = jwt.verify(actualToken, process.env.JWT_SECRET);
    return decoded.userId;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export function getAuthToken() {
  try {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem('token');
    return token || null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

export function getCurrentUserInfo() {
  try {
    if (typeof window === 'undefined') return null;
    const token = getAuthToken();
    if (!token) return null;

    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1]));
    return {
      userId: payload.userId || null,
      username: payload.username || null,
      email: payload.email || null
    };
  } catch (error) {
    console.error('Error getting current user info:', error);
    return null;
  }
}

export function getCurrentUserId() {
  const userInfo = getCurrentUserInfo();
  return userInfo?.userId || null;
}

export function getCurrentUsername() {
  const userInfo = getCurrentUserInfo();
  return userInfo?.username || null;
}

export function isAuthenticated() {
  try {
    const token = getAuthToken();
    if (!token) return false;

    // For client-side validation, we'll do a basic JWT structure check
    // We can't verify the signature on client-side as we don't have JWT_SECRET
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    // Check if token is expired
    try {
      const payload = JSON.parse(atob(parts[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem('token'); // Clear expired token
        return false;
      }
    } catch (e) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
} 