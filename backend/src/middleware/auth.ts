import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import * as jose from 'jose';
import { Env, AuthUser } from '../types';

export async function auth(c: Context<{ Bindings: Env }>, next: () => Promise<void>) {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw new HTTPException(401, { message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const secret = new TextEncoder().encode(c.env.JWT_SECRET);
    
    const { payload } = await jose.jwtVerify(token, secret);
    if (!payload.sub) {
      throw new HTTPException(401, { message: 'Invalid token' });
    }

    // Get user from database
    const user = await c.env.DB.prepare(
      'SELECT id, username FROM users WHERE id = ?'
    ).bind(payload.sub).first<AuthUser>();

    if (!user) {
      throw new HTTPException(401, { message: 'User not found' });
    }

    // Add user to context
    c.set('user', user);
    await next();
  } catch (error) {
    throw new HTTPException(401, { message: 'Unauthorized' });
  }
}
