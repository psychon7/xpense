import { Hono } from 'hono';
import { Env, Variables } from '../types';

const router = new Hono<{ Bindings: Env, Variables: Variables }>();

// Mock expenses data
const mockExpenses = [
  {
    id: 1,
    title: "Monthly Groceries",
    amount: 150.00,
    description: "Groceries from Walmart including vegetables and fruits",
    category: "Food",
    creator: "test1",
    participants: ["test1", "test2", "test3"],
    created_at: "2025-04-14T05:30:00Z",
    is_settled: false,
    bill_image_url: "https://example.com/bill1.jpg"
  },
  {
    id: 2,
    title: "Internet Bill",
    amount: 89.99,
    description: "Monthly internet subscription",
    category: "Utilities",
    creator: "test1",
    participants: ["test1", "test2", "test3"],
    created_at: "2025-04-13T15:20:00Z",
    is_settled: true,
    bill_image_url: "https://example.com/bill2.jpg"
  },
  {
    id: 3,
    title: "Movie Night",
    amount: 45.00,
    description: "Movie tickets and snacks",
    category: "Entertainment",
    creator: "test1",
    participants: ["test1", "test2", "test3"],
    created_at: "2025-04-12T18:45:00Z",
    is_settled: false,
    bill_image_url: null
  },
  {
    id: 4,
    title: "Electricity Bill",
    amount: 120.50,
    description: "March electricity bill",
    category: "Utilities",
    creator: "test2",
    participants: ["test1", "test2", "test3"],
    created_at: "2025-04-11T09:15:00Z",
    is_settled: true,
    bill_image_url: "https://example.com/bill4.jpg"
  },
  {
    id: 5,
    title: "House Cleaning",
    amount: 75.00,
    description: "Monthly cleaning service",
    category: "Other",
    creator: "test1",
    participants: ["test1", "test2", "test3"],
    created_at: "2025-04-10T14:30:00Z",
    is_settled: false,
    bill_image_url: null
  }
];

// Get all expenses
router.get('/', (c) => {
  const username = c.get('username');
  console.log('Getting expenses for user:', username);

  // Filter expenses to show all expenses where the user is either creator or participant
  const userExpenses = mockExpenses.filter(expense => 
    expense.creator === username || expense.participants.includes(username)
  );

  return c.json(userExpenses);
});

// Add new expense
router.post('/', async (c) => {
  const username = c.get('username');
  const formData = await c.req.formData();
  
  const title = formData.get('title') as string;
  const amount = parseFloat(formData.get('amount') as string);
  const description = formData.get('description') as string || '';
  const category = formData.get('category') as string || 'Other';
  const billImage = formData.get('bill_image');

  // Split amount equally between all participants
  const participants = ["test1", "test2", "test3"];
  const splitAmount = amount / participants.length;

  // Calculate new balances
  let updatedBalances = new Map<string, number>();
  
  // Initialize balances
  participants.forEach(user => {
    updatedBalances.set(user, 0);
  });

  // Add the full amount to the payer's balance
  updatedBalances.set(username, amount);

  // Subtract the split amount from each participant
  participants.forEach(user => {
    const currentBalance = updatedBalances.get(user) || 0;
    updatedBalances.set(user, currentBalance - splitAmount);
  });

  // Create new expense
  const newExpense = {
    id: Date.now(),
    title,
    amount,
    description,
    category,
    creator: username,
    participants,
    created_at: new Date().toISOString(),
    bill_image_url: billImage ? 'https://example.com/bill.jpg' : undefined,
    is_settled: false,
    balances: Object.fromEntries(updatedBalances)
  };

  // Add to mock data
  mockExpenses.push(newExpense);

  return c.json(newExpense);
});

// Update expense
router.put('/:id', async (c) => {
  const username = c.get('username');
  const id = parseInt(c.req.param('id'));
  const formData = await c.req.formData();
  
  const title = formData.get('title') as string;
  const amount = parseFloat(formData.get('amount') as string);
  const description = formData.get('description') as string || '';
  const category = formData.get('category') as string || 'Other';
  const billImage = formData.get('bill_image');

  // Find and update expense
  const expenseIndex = mockExpenses.findIndex(e => e.id === id);
  if (expenseIndex === -1) {
    return c.json({ error: 'Expense not found' }, 404);
  }

  mockExpenses[expenseIndex] = {
    ...mockExpenses[expenseIndex],
    title,
    amount,
    description,
    category,
    bill_image_url: billImage ? 'https://example.com/bill.jpg' : mockExpenses[expenseIndex].bill_image_url
  };

  return c.json(mockExpenses[expenseIndex]);
});

// Delete expense
router.delete('/:id', (c) => {
  const id = parseInt(c.req.param('id'));
  const expenseIndex = mockExpenses.findIndex(e => e.id === id);
  
  if (expenseIndex === -1) {
    return c.json({ error: 'Expense not found' }, 404);
  }

  mockExpenses.splice(expenseIndex, 1);
  return c.json({ success: true });
});

export { router as expenseRouter };
