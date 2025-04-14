import { Hono } from 'hono';
import { Env, Variables } from '../types';

const router = new Hono<{ Bindings: Env, Variables: Variables }>();

// Mock expenses data
const mockExpenses = [
  {
    id: 1,
    amount: 150,
    creator: "test1",
    participants: ["test1", "test2", "test3"]
  },
  {
    id: 2,
    amount: 90,
    creator: "test2",
    participants: ["test1", "test2", "test3"]
  },
  {
    id: 3,
    amount: 60,
    creator: "test3",
    participants: ["test1", "test2", "test3"]
  }
];

// Get balance
router.get('/', (c) => {
  const username = c.get('username');
  console.log('Getting balance for user:', username);

  // Calculate balances
  const balances = new Map<string, number>();
  const participants = ["test1", "test2", "test3"];

  // Initialize balances
  participants.forEach(user => {
    balances.set(user, 0);
  });

  // Process each expense
  mockExpenses.forEach(expense => {
    const splitAmount = expense.amount / expense.participants.length;
    
    // Add full amount to creator's balance
    const creatorBalance = balances.get(expense.creator) || 0;
    balances.set(expense.creator, creatorBalance + expense.amount);

    // Subtract split amount from each participant
    expense.participants.forEach(participant => {
      const participantBalance = balances.get(participant) || 0;
      balances.set(participant, participantBalance - splitAmount);
    });
  });

  // Get current user's balance
  const currentUserBalance = balances.get(username) || 0;

  // Calculate who owes the current user and whom the current user owes
  const owedToMe: { user: string; amount: number }[] = [];
  const iOwe: { user: string; amount: number }[] = [];

  participants.forEach(participant => {
    if (participant === username) return;

    const participantBalance = balances.get(participant) || 0;
    const balanceBetweenUsers = participantBalance * -1; // Negative balance means they owe money

    if (balanceBetweenUsers > 0) {
      owedToMe.push({
        user: participant,
        amount: balanceBetweenUsers
      });
    } else if (balanceBetweenUsers < 0) {
      iOwe.push({
        user: participant,
        amount: Math.abs(balanceBetweenUsers)
      });
    }
  });

  return c.json({
    owed_to_me: owedToMe,
    i_owe: iOwe,
    net_balance: currentUserBalance
  });
});

export { router as balanceRouter };
