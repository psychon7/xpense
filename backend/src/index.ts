import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { expenseRouter } from './routes/expense';
import { balanceRouter } from './routes/balance';
import { Env, Variables } from './types';

const app = new Hono<{ Bindings: Env, Variables: Variables }>();

// Enable CORS
app.use('*', cors());

// Add username from header to context
app.use('*', async (c, next) => {
  const username = c.req.header('X-Username');
  if (!username && !c.req.path.startsWith('/auth')) {
    return c.json({ message: 'Unauthorized' }, 401);
  }
  c.set('username', username || '');
  await next();
});

// Mock auth route
app.post('/auth/login', async (c) => {
  const { username, password } = await c.req.json();
  
  // Mock authentication - in real app, verify against database
  const validUsers = ['test1', 'test2', 'test3'];
  if (validUsers.includes(username) && password === 'password') {
    return c.json({ success: true });
  }
  
  return c.json({ message: 'Invalid credentials' }, 401);
});

// Mount routers
app.route('/expenses', expenseRouter);
app.route('/balance', balanceRouter);

// Add health check route
app.get('/', (c) => {
  return c.json({ status: 'ok', message: 'Xpense API is running' });
});

// Add catch-all route for debugging
app.all('*', (c) => {
  console.log('Request:', {
    method: c.req.method,
    path: c.req.path,
    headers: Object.fromEntries(c.req.raw.headers.entries()),
  });
  return c.json({ error: 'Route not found' }, 404);
});

export default app;
