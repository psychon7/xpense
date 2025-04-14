import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import * as bcrypt from 'bcryptjs';
import * as jose from 'jose';
import { auth } from './middleware/auth';
import { processBillImage } from './utils';
import { Env, User, Expense, ExpenseSplit } from './types';

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use('*', cors());

// Auth routes
app.post('/auth/register', async (c) => {
  const { username, email, password } = await c.req.json();
  
  // Hash password
  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);
  
  try {
    await c.env.DB.prepare(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
    ).bind(username, email, password_hash).run();
    
    return c.json({ message: 'User registered successfully' });
  } catch (error) {
    throw new HTTPException(400, { message: 'Username or email already exists' });
  }
});

app.post('/auth/login', async (c) => {
  const { username, password } = await c.req.json();
  
  const user = await c.env.DB.prepare(
    'SELECT * FROM users WHERE username = ?'
  ).bind(username).first<User>();
  
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new HTTPException(401, { message: 'Invalid credentials' });
  }
  
  // Create JWT token
  const secret = new TextEncoder().encode(c.env.JWT_SECRET);
  const token = await new jose.SignJWT({ sub: user.id.toString() })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(secret);
  
  return c.json({ token });
});

// Protected routes
app.use('/expenses/*', auth);
app.use('/users/*', auth);

// Expense routes
app.post('/expenses', async (c) => {
  const user = c.get('user');
  const formData = await c.req.formData();
  
  const title = formData.get('title') as string;
  const amount = parseFloat(formData.get('amount') as string);
  const description = formData.get('description') as string;
  const category = formData.get('category') as string;
  const split_type = formData.get('split_type') as string;
  const billFile = formData.get('bill_image') as File;
  
  let billImageUrl: string | undefined;
  let extractedAmount: number | undefined;
  let extractedDescription: string | undefined;
  
  if (billFile) {
    const fileArrayBuffer = await billFile.arrayBuffer();
    const { imageUrl, amount: detectedAmount, description: detectedDescription } = 
      await processBillImage(fileArrayBuffer, c.env);
    
    billImageUrl = imageUrl;
    extractedAmount = detectedAmount;
    extractedDescription = detectedDescription;
  }
  
  const db = c.env.DB;
  const expense = await db.prepare(`
    INSERT INTO expenses (
      title, amount, description, category, bill_image_url,
      split_type, creator_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    RETURNING *
  `).bind(
    title,
    extractedAmount || amount,
    extractedDescription || description,
    category,
    billImageUrl,
    split_type,
    user.id
  ).first<Expense>();
  
  return c.json(expense);
});

app.get('/expenses', async (c) => {
  const user = c.get('user');
  
  const expenses = await c.env.DB.prepare(`
    SELECT e.*, u.username as creator_username,
    GROUP_CONCAT(DISTINCT es.user_id) as participant_ids,
    GROUP_CONCAT(DISTINCT u2.username) as participant_usernames
    FROM expenses e
    LEFT JOIN users u ON e.creator_id = u.id
    LEFT JOIN expense_splits es ON e.id = es.expense_id
    LEFT JOIN users u2 ON es.user_id = u2.id
    WHERE e.creator_id = ? OR es.user_id = ?
    GROUP BY e.id
    ORDER BY e.created_at DESC
  `).bind(user.id, user.id).all();
  
  return c.json(expenses);
});

app.put('/expenses/:id/settle', async (c) => {
  const user = c.get('user');
  const expenseId = c.req.param('id');
  
  const expense = await c.env.DB.prepare(
    'SELECT * FROM expenses WHERE id = ? AND creator_id = ?'
  ).bind(expenseId, user.id).first<Expense>();
  
  if (!expense) {
    throw new HTTPException(404, { message: 'Expense not found' });
  }
  
  await c.env.DB.prepare(
    'UPDATE expenses SET is_settled = 1 WHERE id = ?'
  ).bind(expenseId).run();
  
  return c.json({ message: 'Expense settled successfully' });
});

app.post('/expenses/:id/splits', async (c) => {
  const user = c.get('user');
  const expenseId = c.req.param('id');
  const { splits } = await c.req.json<{ splits: ExpenseSplit[] }>();
  
  const expense = await c.env.DB.prepare(
    'SELECT * FROM expenses WHERE id = ? AND creator_id = ?'
  ).bind(expenseId, user.id).first<Expense>();
  
  if (!expense) {
    throw new HTTPException(404, { message: 'Expense not found' });
  }
  
  // Begin transaction
  const db = c.env.DB;
  await db.prepare('BEGIN TRANSACTION').run();
  
  try {
    // Delete existing splits
    await db.prepare(
      'DELETE FROM expense_splits WHERE expense_id = ?'
    ).bind(expenseId).run();
    
    // Insert new splits
    for (const split of splits) {
      await db.prepare(`
        INSERT INTO expense_splits (expense_id, user_id, amount)
        VALUES (?, ?, ?)
      `).bind(expenseId, split.user_id, split.amount).run();
    }
    
    await db.prepare('COMMIT').run();
    return c.json({ message: 'Splits updated successfully' });
  } catch (error) {
    await db.prepare('ROLLBACK').run();
    throw new HTTPException(500, { message: 'Failed to update splits' });
  }
});

// User routes
app.get('/users/search', async (c) => {
  const query = c.req.query('q');
  
  if (!query) {
    return c.json([]);
  }
  
  const users = await c.env.DB.prepare(`
    SELECT id, username, email FROM users
    WHERE username LIKE ? OR email LIKE ?
    LIMIT 10
  `).bind(`%${query}%`, `%${query}%`).all();
  
  return c.json(users);
});

export default app;
