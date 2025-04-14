import { Context } from 'hono';
import { Env } from '../types';

const ALLOWED_USERS = [
  "mohan95", "vandana94", "sushruth93",  // Real users
  "test1", "test2", "test3"  // Test users
];

type Variables = {
  username: string;
};

export async function authMiddleware(c: Context<{ Bindings: Env, Variables: Variables }>, next: () => Promise<void>) {
  const username = c.req.header('X-Username');

  if (!username || !ALLOWED_USERS.includes(username)) {
    return c.json({ error: 'You are not part of the flat. Access denied.' }, 401);
  }

  // Add username to context for use in handlers
  c.set('username', username);
  
  await next();
}
