import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env, Variables } from './types';
import { authMiddleware } from './middleware/auth';
import { authRouter } from './routes/auth';
import { expenseRouter } from './routes/expense';
import { balanceRouter } from './routes/balance';
import { billRouter } from './routes/bill';

const app = new Hono<{ Bindings: Env, Variables: Variables }>();

// Add CORS middleware
app.use('*', cors({
  origin: ['http://localhost:3000', 'https://xpense-app.pages.dev'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Username'],
  exposeHeaders: ['Content-Length', 'X-Requested-With'],
  maxAge: 86400
}));

// Add request logging
app.use('*', async (c, next) => {
  console.log(`[${new Date().toISOString()}] 🔄 ${c.req.method} ${c.req.path} - Request started`);
  await next();
});

// Add username from header to context
app.use('*', async (c, next) => {
  const username = c.req.header('X-Username');
  if (!username && !c.req.path.startsWith('/auth')) {
    return c.json({ error: 'Username is required' }, 401);
  }
  c.set('username', username || '');
  await next();
});

// Mount routers
app.route('/auth', authRouter);

// Protected routes with auth middleware
app.use('/expenses/*', authMiddleware);
app.use('/balance/*', authMiddleware);
app.use('/analyze', authMiddleware); // Add auth middleware for analyze endpoint

app.route('/expenses', expenseRouter);
app.route('/balance', balanceRouter);
app.route('/', billRouter);

// Add health check route
app.get('/', (c) => {
  return c.json({ status: 'ok', message: 'Xpense API is running' });
});

export default app;