import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const COOKIE_NAME = 'meeting_app_token';

// Hash password helper
export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Compare password helper
export async function comparePassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// Verify JWT token
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Get current user session from Cookies
export async function getSession() {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get(COOKIE_NAME);
  
  if (!tokenCookie) {
    return null;
  }
  
  return verifyToken(tokenCookie.value);
}

// Set Session cookie on response helper
export async function setSessionCookie(token) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

// Clear Session cookie
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });
}
