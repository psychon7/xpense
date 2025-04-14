import { Hono } from 'hono';
import { Env } from '../types';

export const authRouter = new Hono<{ Bindings: Env }>();

// Login
authRouter.post('/login', async (c) => {
  const { username, password } = await c.req.json();
  
  // Mock authentication - in real app, verify against database
  const validUsers = ['testuser1', 'testuser2', 'testuser3'];
  if (validUsers.includes(username) && password === 'password') {
    return c.json({ success: true });
  }
  
  return c.json({ message: 'Invalid credentials' }, 401);
});
